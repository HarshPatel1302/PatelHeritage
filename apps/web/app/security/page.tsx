'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Shield, User, Package, Car, Bike, CheckCircle2, XCircle, Clock, Calendar, Bell, Camera, RefreshCw } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { canManageVisitors } from '@/lib/auth';
import { Visitor, PreApprovedVisitor } from '@/types';

export default function SecurityPage() {
  const { user } = useAuth();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [preApprovedToday, setPreApprovedToday] = useState<PreApprovedVisitor[]>([]);
  const [allPreApproved, setAllPreApproved] = useState<PreApprovedVisitor[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    purpose: 'visit' as Visitor['purpose'],
    visitingFlat: '',
    entryGate: 'front' as 'front' | 'back',
    vehicleType: 'none' as 'two-wheeler' | 'four-wheeler' | 'none',
    vehicleNumber: '',
  });

  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please ensure permissions are granted.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Flip horizontally for mirror effect if needed, but standard is fine
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedPhoto(dataUrl);
        stopCamera();
      }
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Load all pre-approved visitors
  useEffect(() => {
    const stored = localStorage.getItem('preApprovedVisitors');
    if (stored) {
      try {
        const visitors = JSON.parse(stored);
        // All pending pre-approved visitors
        const allPending = visitors.filter((v: PreApprovedVisitor) =>
          v.status === 'pending'
        );
        setAllPreApproved(allPending);

        // Today's pre-approved visitors
        const todayPending = allPending.filter((v: PreApprovedVisitor) =>
          new Date(v.visitDate).toDateString() === new Date().toDateString()
        );
        setPreApprovedToday(todayPending);
      } catch (error) {
        console.error('Error loading pre-approved visitors:', error);
      }
    }
  }, []);

  // Load existing visitors
  useEffect(() => {
    const stored = localStorage.getItem('visitors');
    if (stored) {
      try {
        setVisitors(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading visitors:', error);
      }
    }
  }, []);

  // Check if user is security
  if (!canManageVisitors(user)) {
    return (
      <ProtectedRoute requireAuth={true}>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 pt-24 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 text-center">
            <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Access Restricted</h2>
            <p className="text-white/70">Only security guards can access this page.</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const visitor: Visitor = {
      id: Date.now().toString(),
      ...formData,
      status: 'pending',
      entryTime: new Date(),
      registeredBy: user.name || 'Security',
      approvedBy: user.name || 'Security',
      photo: capturedPhoto || undefined,
    };

    const updatedVisitors = [visitor, ...visitors];
    setVisitors(updatedVisitors);
    localStorage.setItem('visitors', JSON.stringify(updatedVisitors));

    // Mark pre-approved as used if exists
    const preApprovedMatch = allPreApproved.find(p =>
      p.name.toLowerCase() === formData.name.toLowerCase() &&
      p.visitingFlat === formData.visitingFlat
    );
    if (preApprovedMatch) {
      const stored = localStorage.getItem('preApprovedVisitors');
      if (stored) {
        const allPreApprovedList = JSON.parse(stored);
        const updated = allPreApprovedList.map((p: PreApprovedVisitor) =>
          p.id === preApprovedMatch.id ? { ...p, status: 'used' as const } : p
        );
        localStorage.setItem('preApprovedVisitors', JSON.stringify(updated));
        setAllPreApproved(allPreApproved.filter(p => p.id !== preApprovedMatch.id));
        setPreApprovedToday(preApprovedToday.filter(p => p.id !== preApprovedMatch.id));
      }
    }

    // Send notification to flat (in production, this would be a push notification)
    const notification = {
      id: Date.now().toString(),
      flat: formData.visitingFlat,
      message: `Visitor ${formData.name} has arrived at ${formData.entryGate} gate`,
      timestamp: new Date(),
      type: 'visitor',
    };

    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    localStorage.setItem('notifications', JSON.stringify([notification, ...notifications]));

    setFormData({
      name: '',
      phone: '',
      purpose: 'visit',
      visitingFlat: '',
      entryGate: 'front',
      vehicleType: 'none',
      vehicleNumber: '',
    });
    setCapturedPhoto(null);

    alert(`Visitor registered! Notification sent to ${formData.visitingFlat}`);
  };

  const applyPreApproved = (preApprovedVisitor: PreApprovedVisitor) => {
    setFormData({
      name: preApprovedVisitor.name,
      phone: preApprovedVisitor.phone || '',
      purpose: 'visit',
      visitingFlat: preApprovedVisitor.visitingFlat,
      entryGate: 'front',
      vehicleType: 'none',
      vehicleNumber: '',
    });
  };

  return (
    <ProtectedRoute requireAuth={true} requiredRole={['security']}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 pt-24">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* This screen predates the database-backed system: its visitor list
              lives in this browser's localStorage only, so nothing recorded here
              reaches residents or other devices. Say so plainly rather than
              letting a guard trust it. */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3">
            <p className="text-amber-100">
              <strong>Legacy screen.</strong> Entries logged here stay on this device only. Use the
              live Gate Console for real visitor and card entry.
            </p>
            <a
              href="/gate"
              className="shrink-0 rounded-lg bg-heritage-gold px-4 py-2 font-semibold text-black"
            >
              Open Gate Console
            </a>
          </div>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-8 h-8 text-heritage-gold" />
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                Security - Visitor Management
              </h1>
            </div>
            <p className="text-gray-300">Register visitors and manage entries</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Pre-approved Visitors for Today */}
            {preApprovedToday.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
              >
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <Bell className="w-6 h-6 text-heritage-gold" />
                  Pre-approved Visitors (Today)
                </h2>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {preApprovedToday.map((visitor) => (
                    <div
                      key={visitor.id}
                      className="bg-white/5 rounded-lg p-4 border border-heritage-gold/30"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-white font-semibold">{visitor.name}</h3>
                          <p className="text-white/70 text-sm">Visiting: {visitor.visitingFlat}</p>
                          <p className="text-white/60 text-xs">Pre-approved by: {visitor.preApprovedBy}</p>
                          {visitor.phone && (
                            <p className="text-white/60 text-xs">{visitor.phone}</p>
                          )}
                        </div>
                        <button
                          onClick={() => applyPreApproved(visitor)}
                          className="px-3 py-1 bg-heritage-gold/20 hover:bg-heritage-gold/30 text-heritage-gold rounded-lg text-xs transition-all"
                        >
                          Use
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Registration Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Register Visitor Entry</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-white/80 mb-2">Visitor Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-heritage-gold"
                  />
                </div>

                <div>
                  <label className="block text-white/80 mb-2">Phone</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-heritage-gold"
                  />
                </div>

                <div>
                  <label className="block text-white/80 mb-2">Purpose</label>
                  <select
                    required
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value as Visitor['purpose'] })}
                    className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-heritage-gold"
                  >
                    <option value="visit">Visit</option>
                    <option value="delivery">Delivery/Parcel</option>
                    <option value="service">Service</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white/80 mb-2">Visiting Flat</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., A201"
                    value={formData.visitingFlat}
                    onChange={(e) => setFormData({ ...formData, visitingFlat: e.target.value.toUpperCase() })}
                    className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-heritage-gold"
                  />
                </div>

                <div>
                  <label className="block text-white/80 mb-2">Entry Gate</label>
                  <select
                    required
                    value={formData.entryGate}
                    onChange={(e) => {
                      const gate = e.target.value as 'front' | 'back';
                      setFormData({
                        ...formData,
                        entryGate: gate,
                        vehicleType: gate === 'front' ? 'none' : formData.vehicleType
                      });
                    }}
                    className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-heritage-gold"
                  >
                    <option value="front">Front Gate (Walk-in only)</option>
                    <option value="back">Back Gate (Vehicles allowed)</option>
                  </select>
                </div>

                {formData.entryGate === 'back' && (
                  <>
                    <div>
                      <label className="block text-white/80 mb-2">Vehicle Type</label>
                      <select
                        value={formData.vehicleType}
                        onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value as any })}
                        className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-heritage-gold"
                      >
                        <option value="none">No Vehicle</option>
                        <option value="two-wheeler">Two Wheeler</option>
                        <option value="four-wheeler">Four Wheeler</option>
                      </select>
                    </div>
                    {formData.vehicleType !== 'none' && (
                      <div>
                        <label className="block text-white/80 mb-2">Vehicle Number</label>
                        <input
                          type="text"
                          value={formData.vehicleNumber}
                          onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                          className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-heritage-gold"
                        />
                      </div>
                    )}
                  </>
                )}
                <>
                  <div>
                    <label className="block text-white/80 mb-2">Visitor Photo</label>

                    {!isCameraOpen && !capturedPhoto && (
                      <button
                        type="button"
                        onClick={startCamera}
                        className="w-full py-8 border-2 border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center text-white/60 hover:text-heritage-gold hover:border-heritage-gold/50 transition-colors"
                      >
                        <Camera className="w-8 h-8 mb-2" />
                        <span>Click to capture photo</span>
                      </button>
                    )}

                    {isCameraOpen && (
                      <div className="relative rounded-lg overflow-hidden bg-black">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="w-full h-auto aspect-video object-cover"
                        />
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                          <button
                            type="button"
                            onClick={capturePhoto}
                            className="px-6 py-2 bg-white text-black rounded-full font-semibold hover:bg-gray-200 transition-colors"
                          >
                            Capture
                          </button>
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="px-6 py-2 bg-red-500 text-white rounded-full font-semibold hover:bg-red-600 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {capturedPhoto && (
                      <div className="relative rounded-lg overflow-hidden">
                        <img
                          src={capturedPhoto}
                          alt="Visitor"
                          className="w-full h-auto aspect-video object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={retakePhoto}
                          className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors backdrop-blur-sm"
                        >
                          <RefreshCw className="w-5 h-5" />
                        </button>
                      </div>
                    )}

                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                </>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-heritage-gold to-yellow-500 text-black font-semibold rounded-lg hover:shadow-lg transition-all"
                >
                  Register & Notify Flat
                </button>
              </form>
            </motion.div>
          </div>

          {/* All Pre-approved Visitors from All Members */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
          >
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-heritage-gold" />
              All Pre-approved Visitors (All Society Members)
            </h2>
            <p className="text-white/70 text-sm mb-6">
              Complete list of all pre-approved visitors from owners and tenants
            </p>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {allPreApproved.length === 0 ? (
                <div className="text-center py-12 text-white/70">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No pre-approved visitors</p>
                </div>
              ) : (
                allPreApproved.map((visitor) => {
                  const visitDate = new Date(visitor.visitDate);
                  const isToday = visitDate.toDateString() === new Date().toDateString();
                  const isPast = visitDate < new Date() && !isToday;

                  return (
                    <div
                      key={visitor.id}
                      className={`bg-white/5 rounded-lg p-4 border ${isToday
                        ? 'border-heritage-gold/50 bg-heritage-gold/10'
                        : isPast
                          ? 'border-red-500/30 bg-red-500/5'
                          : 'border-white/10'
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-white font-semibold">{visitor.name}</h3>
                            {isToday && (
                              <span className="px-2 py-0.5 bg-heritage-gold/30 text-heritage-gold rounded text-xs">
                                Today
                              </span>
                            )}
                            {isPast && (
                              <span className="px-2 py-0.5 bg-red-500/30 text-red-300 rounded text-xs">
                                Past
                              </span>
                            )}
                          </div>
                          <div className="space-y-1 text-sm text-white/70">
                            <p>Visiting: <span className="text-white font-medium">{visitor.visitingFlat}</span></p>
                            <p>Pre-approved by: <span className="text-white font-medium">{visitor.preApprovedBy}</span> (Owner/Tenant)</p>
                            {visitor.phone && (
                              <p>Phone: {visitor.phone}</p>
                            )}
                            <div className="flex items-center gap-2 text-xs text-white/60">
                              <Calendar className="w-3 h-3" />
                              <span>Expected: {visitDate.toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => applyPreApproved(visitor)}
                          disabled={isPast}
                          className={`px-3 py-1 rounded-lg text-xs transition-all ${isPast
                            ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                            : 'bg-heritage-gold/20 hover:bg-heritage-gold/30 text-heritage-gold'
                            }`}
                        >
                          {isPast ? 'Expired' : 'Use'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>

          {/* Recent Entries */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Recent Entries</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {visitors.length === 0 ? (
                <div className="text-center py-12 text-white/70">
                  <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No entries registered yet</p>
                </div>
              ) : (
                visitors.slice(0, 20).map((visitor) => (
                  <div
                    key={visitor.id}
                    className="bg-white/5 rounded-lg p-4 border border-white/10"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        {visitor.photo && (
                          <div className="mb-2">
                            <img src={visitor.photo} alt={visitor.name} className="w-16 h-16 rounded-full object-cover border-2 border-heritage-gold/50" />
                          </div>
                        )}
                        <h3 className="text-white font-semibold">{visitor.name}</h3>
                        <p className="text-white/70 text-sm">{visitor.phone}</p>
                        <div className="flex items-center gap-4 mt-2 text-white/60 text-xs">
                          <span>Visiting: {visitor.visitingFlat}</span>
                          <span className="capitalize">{visitor.purpose}</span>
                          {visitor.entryTime && (
                            <span>{new Date(visitor.entryTime).toLocaleTimeString()}</span>
                          )}
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-green-500/30 text-green-200 rounded-full text-xs">
                        {visitor.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

