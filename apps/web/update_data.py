import re
import json

owners_raw = """
WING A
201 | Mr. vinod gupta | 8789268968
202 | Mrs. Nandini Dubey & Mr. Dhiraj Rajeshwar Prasad Dubey | 9833999127
203 | Mr. Prakash Jethanand Kella & Mrs. Urmila Prakash Kella | 9099037126
301 | Mr. K. G. Prasad & Mrs. P. Sathya | 9167006403
302 | Mrs. Veena Chandnarayan Tiku & Mr. Chandnarayan Trilok Tiku | 9819412560
303 | Mr. Satish Pandita & Mrs. Monika Pandita | 9819412560
401 | Mr. K. V. Hoizal & Mrs. Rashmi Hoizal | 9969226448
402 | Mr. Paritosh Barui & Mrs. Basabdatta Barui | 9769948692
403 | Mr. Tushar Premnath Sonawane / Mrs. Swati Tushar Sonawane | 9769989972
501 | Mr. Arvind Prasad Mishra & Mrs. Sapna Arvind Mishra | 9819007859
502 | Mr. Vinod Hardwar Singh & Mrs. Sangeeta Vinod Singh | 9004413925
503 | Mr. Vidya Sagar Prasad | 9892313625
601 | Mrs. Amrutben Jethalal Patel (Gandhi) & Mr. Jethalal Kanji Patel(Gandhi) | 9920406103
602 | Mr. Sarvesh Chandra Pandey & Mrs. Neelam Pandey | 9969228333
603 | Mr. Kamala Ramjanam Singh | 8082021865
701 | Mr. Deshraj Singh & Mrs. Sharda Singh | 9969226413
702 | Mr. Srikant Singh | 9869327237
703 | Mr. Om Prakash Singh | 9757012276
801 | Mr. Saumen Ghosh & Mrs. Lipika Ghosh | 9804939192
802 | Dr. Om Prakash Rajput & Mrs. Geeta Rajput | 7710091747
803 | Mr. Arun Kumar Saxena & Mrs. Rashmi Saxena | 9969228324
901 | Mr. Ramdev Chowdhary & Mrs. Jeeya Chowdhary | 9969224545
902 | Mr. Ashok Kumar Srivastava & Mrs. Prakrati | 8108781874
903 | Mr. Rakesh Kumar | 9969224359
1001 | Mr. Gunturu Sreenivasa Babu & Mrs. Gunturu Annapurna | 9819330248
1002 | Mr. Praveen Chandak & Mrs. Deepika Chandak | 9649999260
1003 | Mr. Kamdeo Tukaram Khandekar & Mrs. Ujwala Kamdeo Khandekar | 9820974740
1101 | Mr. Vinod Bhikaji Rane | 9987722970
1102 | Mr. Rajendra Vasudeo Sali | 9967870138
1103 | Mr. Namdev Dnyanu Salunkhe | 9821019151
1201 | Mr. Rajeev Kumar Sood | 66818464527
1202 | Mr. Rudra Dev Gaur & Mrs. Aasha Gaur | 9969223201
1203 | Mrs. Ranjana Sood Choudhary | 9969224345
1301 | Mrs. S. Anuradha & Mr. S. Krishnan | 9967570472
1302 | Mr.Niraj Tiwari & Mr. Omprakash Tiwari | 8422999124
1303 | Mr. S. Krishnan & Mrs. Geeta Krishnan | 9967570472
1401 | Mr. Alok Rathore & Mr. Yogendra Singh Rathore | 9930116528
1402 | Mr. Rajeev Kumar & Mrs. Anju Prasad | 9892141034
1403 | Mr. Ashok Puthukulangara Mukundan & Mrs. Vidya Ashok Mukundan | 9869222321
1501 | Mr. Sainath Pandhrinath Pawaskar & Mr. Abhishek Sainath Pawaskar | 9867375983
1502 | Mr. Rajender Arora & Mr. Sanjay | 9810507449
1503 | Mr Mukul Kumar Agrawal & Mrs. Nidhi Agrawal | 9999649800
1601 | Mr. Satish Shrimali & Mrs. Neena Shrimali | 9414307329
1602 | Mr.S.A.Naikwadi | 9892895742
1603 | Mrs. Mohini Rajendra Shandilya & Mr. Rajendra Krishna Shandilya | 9969015945
1701 | Mrs. Sudha Sanjiva & Mr. Guruprasad Ramachar Sanjiva | 9022799600
1702 | Mr. Kulbir Singh Sant Singh Thandhi | 9820805496
1703 | Mr. Jangala Rajendra Babu & Mrs. Jangala Santhi Priya | 9969220182

WING B
201 | Pravin Kumar Vallabh Das Pethani | 9322298823
202 | Mr. Rameshchandra Petha Vora & Mr. Dinesh Pethabhai Vora | 9930550360
301 | Mr. Charanjeev Singh Obhan & Mrs. Kanwaljeet Kaur | 7045489778
302 | Mr. Dilpreet Singh Obhan & Mr. Amarjeet Singh Obhan & Mrs. Kanwaljeet Kaur Obhan | 7045489778
401 | Mr. Dinesh Sopan Choudhari & Mrs. Purnima Dinesh Choudhari | 9167670402
402 | Mr. Ashish Anand Singhal & Mrs. Ruby Ashish Singhal | 9004559587
501 | Mr. Sunil G. Kriplani & Mrs. Varsha S. Kriplani | 7715935590
502 | Ms. Vrushali J. Gandhi | 9930738409
601 | Mr. Satyendra Rai | 9969226134
602 | Mr. R. Balaji | 9969225306
701 | Mrs. Suniti Singh & Ms. Shruti Singh | 9320201242
702 | Mr. Suresh Chand & Mrs. Hemlata Bharti | 9969224730
801 | Kaberi Mazumder & Sanjay Kumar Mazumder | 9965226238
802 | Mr. Rajat Malhotra | 9426614936
901 | Mr. Ramakant Mahadeo Auti & Mrs. Sudha Ramakant Auti | 9821151924
902 | Mr. Ramakant Mahadeo Auti & Mrs. Sudha Ramakant Auti | 9821151924
1001 | Mr. Rajib Kumar Dey & Mrs. Sutapa Dey | 9969228107
1002 | Mr. M. A. A. Srinivas & Mrs. M. Indumathi Srinivas | 9969227625
1101 | Mr. Shashikant Prabhakar Kumbhar | 9820427666
1102 | Mrs. Seema Shashikant Kumbhar | 9820427666
1201 | Mr. Vinod Kumar Chhabra & Dr. (Mrs.) Nita Chhabra | 9969223202
1202 | Mr. Rameshwar Prasad Kuldeep | 9969226521
1301 | Mr. Pradeep Kumar Porwad & Mrs. Sangeetha Porwad | 9821193517
1302 | Mr. Dayanand Maruti Jawalikar & Mr. Vithalrao Shankarrao Shinde | 9870407720
1401 | Mr. Manmohan Garhwal | 7045333077
1402 | Mrs. Vibha Manmohan Garhwal | 7045333077
1501 | Mr. Deepak Kumar & Mrs. Sushma Pal | 9833098932
1502 | Mr. Karanam Raghunath Hindapur & Mrs. Bharathi Raghunath | 7208692370
1601 | Mr. Gajendra Singh & Mrs. Dhan Devi Singh | 8369109648
1602 | Mr. Pradeep Singh Nagesh | 9987445597
1701 | Mr. Prakash P. Kamerkar & Mrs. Pradnya P. Kamerkar | 9540994515
1702 | Mrs. Usha Bhaskar Dhatavkar | 9969233506
1801 | Mrs. Ramavati Premprasad Varma | 9699807001
1802 | Mrs. Neelu Satyarthi | 9412249199
1901 | Mrs. Vanita Umesh Munde & Mr. Umesh Sadashive Munde | 9987647330

WING C
201 | Mr. Rajshekhar S. Hiremath, Mr. Somashekhar Hiremath & Mrs. Pruthvi Hiremath | 7021820997
202 | Mrs. Neela Baban Satpute | 9579714477
301 | Ms. Manisha Sharad Ahire | 9892014873
302 | Mr. Panchaksharaiah P. M. & Mrs. Sheela Panchakshari | 9833292834
401 | Mr. Sarabjeet Singh Matharu | 9823025829
402 | Mr. Balakrishnan P. K. & Mrs. Raji Balakrishnan | 9820002559
501 | Mr. Kishor S. Rao | 9821070516
502 | Mr. Suresh M. Pingle & Mrs. Rajashri Suresh Pingle | 9892000219
601 | Dr. Prabha Rani Singh | 9113304574
602 | Mr. Nandkishor Madhavrao Patil | 9223289276
701 | Mr. Vimal Gaurishankar Barot, Mrs. Aarti Vimal Barot & Mr. Gaurishankar Ghelabhai Barot | 9820080525
702 | Mr.Neeraj Sharma | 9969229171
801 | Mrs. Usha Shivaji Jagadale | 9702941041
802 | Mr. Vijay M. Pingle & Mrs. Sujata Vijay Pingle | 9892478173
901 | Mrs. Prabha S. Pandey | 9930450541
902 | Mr. Paras Jain & Mrs. Sangita Jain | 9820107811
1001 | Mr. Sameer Singh & Mrs. Sadhvi Singh | 9820059254
1002 | Dr. L. S. Poonja | 9821972704
1101 | Mr. Suresh Chottu Deol & Mrs. Geeta Suresh Deol | 9820028239
1102 | Mr. Satish Kumar Munshi | 9867945088
1201 | Mr. Nitin Das | 9930945213
1202 | Mrs. Ashwini Ratnakant Inamdar | 8805648748
1301 | Mrs. Priyadarshini Dinesh Shetty Mr. Dinesh Shetty | 9833155591
1302 | Mrs. Nandini Vaibhav Naikawadi | 9321240962
1401 | Mr. Prakash B. Ahuja / Mrs. Lenna P. Ahuja | 9820100124
1402 | Mr. Shishir Harishchandra Hattewar & Mrs. Nutan Shishir Hattewar | 9435715533
1501 | Mr. Vinod Manik Kavle / Mrs. Priyanka Vinod Kavle / Mrs. Kamal Manik Kavle | 9967331204
1502 | Mr.Kailash B. Nikam / Mrs. Vaishali K. Nikam | 9833390957
1601 | Mr Vijay M Pingle | 9892478173
1602 | Mr. Neeraj Jain | 9820455541
1701 | Mr.P.N.Tripathi | 9819311648
1702 | Mr. Sanjay Bhaskar Nikam | 9324603944
1801 | Mr. Amod Khare & Mrs. Monika Khare | 9833654655
1802 | Mrs.Sarita Upadhyay & Mr. Ashok Kumar | 7814035564
1901 | Mrs. Rekha Singh & Mr. Ravindrapal Singh | 9869054250

WING D
201 | Mr. Devraj Manji Barvadiya / Mrs. Amarben Devraj Barvadiya | 9920259692
202 | Amrutlal Malla Patel (Patni) | 9892770550
301 | Mrs. Ruchee Agarwal & Mr. Akshdeep Suresh Agarwal | 9819194395
302 | Mr. Umesh Chandra Bhatt & Mrs. Neeru Bhatt | 9869121836
401 | Mr. Veldanda Venkateshwar Rao & Mrs. Veldanda Sukeshini | 9969227621
402 | Mrs. Bharati Kulshrestha | 7042191478
501 | Mr. Manoj Kumar Sahu & Mrs. Sudha Manoj Sahu | 9594965083
502 | mrs sonali koli | 7900109950
601 | Mr. Chandrakant Ghelabhai Barot & Mr. Pravinchandra Ghelabhai Barot | 9820486999
602 | Mr.Kamlesh Mehata & Mrs. Hemali Kamlesh Mehata | 9326024105
701 | Mr. Narshi Gela Ravat (Patel) & Mrs. Kamuben Narshi Ravat (Patel) | 9820244396
702 | Mr. Jatinder Sahni & Mrs. Kavita Sahni | 9004268108
801 | Mr. Rohit Garg & Mrs. Minakshi Garg | 9969220800
802 | Mrs. Dipti Singh | 8802999322
901 | Mr. Sanjay G Mayani Mrs.Sangeeta S Mayani | 9819821616
902 | Mr. Vinay Tukaram Wakade & Mrs. Meena Vinay Wakade | 8419976260
1001 | Mr. Davinder Singh Ahlawat | 9867090829
1002 | Mr. Vijay Kumar | 9445005968
1101 | Mrs. Alpa Gupta | 9223529361
1102 | Mrs. Latha Reny Sam & Mr. Reny Sam Koshy | 9820624165
1201 | Mr. Jambunathan Raju & Mrs. Kala Raju | 9833848503
1202 | Mr. Brahma Mall & Mrs. Meera Singh | 9819878143
1301 | Mr. Rahul Kisan Patil | 9768114999
1302 | Mr. Kisan Joma Patil | 9322351912
1401 | Mr. Sarvesh Gaur | 9820316296
1402 | Mr. Raghu Ambavi Patel & Mrs. Punjiben Raghu Patel | 9892809040
1501 | Mrs. Gouri Prova Singh | 9892098216
1502 | Mr. Vasant Nanji Patel / Mrs. Savita Vasant Pate; | 9819149178
1601 | Mr. Shivaji Bhimaji Choudhary & Mrs. Suchita Shivaji Chaudhary | 9820196030
1602 | Mr. Heem Dilip Ashar & Mrs. Sushma Prasad Ashar | 9167542327
1701 | Mr Ravindradas Padmanabhan & Mrs. Suprabha Ravindradas | 9820138753
1702 | Mr. Suraj R Das & Mrs. Reeja S. Das | 9820103465
1801 | Mr. Ravi Baidhyanath Prasad | 9969223204
1802 | Mr. Laxman Devji Pate l & Mrs.Sati Laxman Vaviya & Mr.Haresh Devaji Vaviya | 9819946937
1901 | Mr.Harji G Gajora & Mr.Ramesh H Gajora | 9930873387

WING E
201 | Mr. Valji Karamshi Patel (Patni) | 9820331328
202 | Mr. Kanji Karamshi Patel(Patni) | 9920406103
301 | Mr. Girjesh Kumar Srivastava & Mrs. Surya Kumari Srivastava | 9515108721
302 | Mr. Rajeev R. Nair, Mr. G. Radhakrishnan Nair & Mrs. Shanta R. Nair | 9867668777
401 | Mr. Surinder K. Bhagat | 9820081995
402 | Mr. Raj Nandan & Mrs. Anjana Srivastava | 9869795158
501 | Mrs. Bimla Debi | 9818690924
502 | Mr. Kamlesh Chandra Shrivastava & Mrs. Anu Shrivastava | 7718893216
601 | Mr. Yele Balasaheb Tukaram | 9987442647
602 | Mr. Seelamanthula Munikeswara Rao & Mrs. Seelamanthula Venkata Naga Vara Krishnaveni | 9969224179
701 | Mr. Rajender Vilas Kadam | 9324544741
702 | Mrs. Padma Vilas Kadam | 9324544741
801 | Mr. Vasant Mavji Patel & Mrs. Valiben Vasant Patel | 9819074234
802 | Mr. Vijaykumar B Shete | 9004022808
901 | Mr.Deepak Keshavrao Gadhave & Mrs. Sheetal Deepak Gadhave | 9833026718
902 | Mrs. Girija Jaikumar | 9619248086
1001 | Mr. Bhanji Raghavji Ravriya | 9930957788
1002 | Mrs. Anita Bhanji Ravriya | 9320080048
1101 | Mr. Sanjay Kumar Mazumder & Mrs. Kaberi Mazumder | 9969226238
1102 | Mrs. Manju Goyal & Mr. Aman Goyal | 9825208236
1201 | Mrs. Vibha Bhupen Doshi & Mr. Bhupen Pritamlal Doshi | 9821041796
1202 | Mrs. Naina Prem Tripathi & Mr. Prem Nidhi Tripathi | 9819311648
1301 | Mr.Nagraj Otaramji Chodhary & Mrs Shantidevi Nagraj Choudhary | 9322245078
1302 | Mr.Pitaram P Choudhary & Mrs.Kamala P Choudhary | 9323181619
1401 | Mr. Satbir Singh Arora & Mrs. Slinder Kaur Chowdhry | 9029221313
1402 | Mr. Manepalli Srikrishna Sarma & Mrs. Manepalli Kameswari Devi | 9969228955
1501 | Mr. Akshdeep Agarwal / Mrs. Ruchee A. Agarwal | 9819194395
1502 | Mr. Jalla Narasimha Rao & Mrs. Jalla Aruna | 9619487551
1601 | Mr. Abhik Kumar Sen & Mrs. Kakoli Sen | 9820752726
1602 | Mr. Pratha Satyanarayana & Mrs. Pratha Bharati | 9869282332
1701 | Mrs. Alka Jain & Mr. Neeraj Jain | 9820086571
1702 | Dr.Prashant Nanasaheb Mohite | 9370411255
1801 | Mr. Achalaram Amraramji Choudhary & Mr.Otaram Amraramji Choudhary | 9324493835
1802 | Mr. Jayanti Govind Somani & Dhanwanti Jayanti Somani | 9987708822
1901 | Mr. Sanjay Bhasker Nikam and Mr. Kailash Bhasker Nikam | 9833390957

WING F
201 | Mr. Harish G. Parmani & Mr. Subhash G. Parmani | 9833690268
202 | Mr.Prakash Bhiku Borhade & Mrs Manda Prakash Borhade | 9867727062
203 | Mrs. Asha Arvind Telang & Mrs. Vrinda Rajan Hawal | 9969437922
301 | Mr. Ashok Kumar Pandey | 9820211670
302 | Mr. Anmol Shrimant Kamble | 8433452303
303 | Mr. Pravin Kumar & Mrs. Kavita Kumar | 9819150401
401 | Mr. Akshdeep Sureshchandra Agarwal & Mrs. Ruchee Akshdeep Agarwal | 9773004456
402 | Mr. Salian Kiran Krishna & Mrs. Salian Sujatha Kiran | 9619087779
403 | Mrs. Rashmi Govindankutty Menon | 9892501550
501 | Mr. Pramod Kumar & Mrs. Sreeja P. Kumar | 8830302695
502 | Mr. Karman Gela Ravat & Mrs. Rupiben Karman Ravat | 9930590682
503 | Mr. Arijit Sengupta & Mrs. Abanti Sengupta | 9820993739
601 | Mrs. Vidhi G. Punjabi & Mr. Girish N. Punjabi | 7045346563
602 | Mr. Sameer Sahebrao Labde | 9867261710
603 | Mr. Aveek Senapati & Mrs. Sparshi Banarjee | 8130369991
701 | Mr. Vijendra Singh & Mrs. Neelam Singh | 9426614242
702 | Mr. Pradeep Kumar & Mrs. Mamta Kumar | 9410390947
703 | Mr. Rachit Madan Vohra & Mrs. Rashmi Rachit Vohra | 8971775163
801 | Mrs. Parma Harji Patel | 9920131477
802 | Mr. Mrs. Suhasini Pradhan & Mr Amit Pradhan | 9223532289
803 | Mrs Rajani Thiagaraja Ayyar | 9967393005
901 | Mr. Satyakumar Vasamshetty & Mr. Suryanarayana Vasamshetty | 9769713440
902 | Mrs. Swati Devendra Shinde & Devendra Subhash Shinde | 9004063982
903 | Mr. Manish Gupta & Mr. Mahendra Kumar Gupta | 9594006917
1001 | Mr. Deepak Ramchandra Kshirsagar & Mrs. Ujwala D. Kshirsagar | 9967437740
1002 | Mr. Deepak Ramchandra Kshirsagar & Mrs. Ujwala D. Kshirsagar | 9967437740
1003 | Mr. Hamvir Singh & Mrs. Sunita Singh | 9819459879
1101 | Mrs. Prakrati & Mr. Ashok Kumar Srivastva | 8108791874
1102 | Mr. Janardan V. Pimpale & Mrs. Kantabai J. Pimpale | 9029011504
1103 | Mrs. Rup Priya Verma | 9769412577
1201 | Mr. Shivaji Bhimaji Chaudhary & Mrs. Suchita Shivaji Chaudhary | 9820196030
1202 | Mr. Ayan Gupta & Mr. Bibhu Ranjan Gupta | 9769580274
1203 | Mr. Ravindra Pal Singh & Mrs. Rekha Singh | 9869054250
1301 | Mr. Amalendu C. Purandare & Mrs. Sarika A. Purandare | 9820418244
1302 | Mr. Rudyben Dinesh Choudhary / Mr. Dinesh Kanji Choudhary | 9819131072
1303 | Mr. N. Talisunup Jamir & Mrs. Anne Thomas Vushim | 9969220179
1401 | Mr. Shrikant Wasudeo Narkhede | 9820757840
1402 | Mr. Ramesh V Choudhary | 9833330330
1403 | Mr. Akhilesh & Mrs. Dolly Khare | 9869222904
1501 | Mrs Subramanyan Anuradha | 9967570472
1502 | Mr. Nilesh R. Pawar & Mrs. Ashvini N. Pawar | 9967435806
1503 | Mr. Rajveer Singh Tomar | 9833458495
1601 | Mrs. Sharmistha Dutta | 9920520005
1602 | Mr. Anil Kamath & Mrs. Smitha Kamath | 9322099299
1603 | Mrs. Ritu Jain & Mr. Sunil Kumar Ratanlal Jain | 9999649900
1701 | Mrs. Prabha Rani Singh | 9113304574
1702 | Mr. Suresh Kumar | 9869266183
1703 | Mr. Vikas Trivedi | 9819878143
"""

tenants_raw = """
WING A
A-202 | Mr. Atul Modi | 9821023697
A-301 | Mr. Hemant Kumar Rawat | 9167006403
A-302 | Mr. Balasankula Uday Bhaskar Rao | 9819412560
A-303 | Rahul Choudhry | 9819412560
A-402 | Mr. Deepika Tukaram Dudhe | 9769948692
A-403 | Mr. Siddharth Gupta | 9769989972
A-502 | Jaydeep Bithare | 9004413925
A-801 | Chandra Praksh | 9804939192
A-1102 | Sibabrata Choudhury | 9967870138
A-1201 | Mr. Shylesh Sivadasan | 9871978883
A-1302 | Capt. Shailesh Awasthi | 9768011109
A-1403 | Mr. Denesam Gunasekaran | 8891427205
A-1501 | Aditya Jha | 9867375983
A-1503 | Gelabikumar Harikrishrbhai Modi | 9004389112
A-1701 | Subhendu Sekher Manna | 9022799600
A-1703 | Sibprasad Ray | 9969220182

WING B
B-301 | Mr. Manoj Sharma | 7045489778
B-302 | Manish Gupta | 7045489778
B-501 | Mr. Ateet Wagh | 7715935590 / 7227953287
B-701 | Puthucode Gopalkrishnan | 9320201242
B-801 | Dr. Rajendra Khade | 9819415427
B-1002 | Mr. Vinod Ninnd Tembulkar | 9969227625
B-1202 | Satinder Singh | 9969226521
B-1301 | Sunil Kothari | 9821193517
B-1501 | Mr. Ankur Garg | 996922120
B-1702 | Mr. Arjun Narayan Kadam | 9969233506
B-1802 | Mrs. Saugata Sukumar Biswas | 9426614242

WING C
C-202 | Umesh Kumar Panday | 9579714477
C-402 | Mrs. Vidya Amrut Mety | 9892014873 / 9820002559
C-601 | Mr. Laxman Devaji Vaviya | 9372790056
C-702 | Mr. Sailesh Patel | 9969229171
C-1001 | Mrs. Devayani Nitin Phadke | 9820059254
C-1302 | Mr. Bharadawad Masikar | 9321240962 / 9560446188
C-1502 | Alpa Srivastava | 8591422976
C-1602 | Mr. Omkar Jhadhav | 9820455541
C-1702 | Mr. Garai Suman | 9833654655
C-1801 | Mr. Pramod Agrawal | 9820094710

WING D
D-202 | Komal C. Patel | 9819194395
D-301 | Dr. Swati Mane | 9969227621
D-401 | Mr. Ravi Gupta | 7042191478
D-402 | Mr. Vijay Anand & Mrs. Shanu Sinha | 8802999322
D-802 | Anoop V. Gopinathan | 9820624165
D-1102 | Mr. Gaurav Choudhary | 9819878143
D-1202 | Mr. Tushar Srivastava | 9167542327
D-1602 | Mrs. Sanjana Deb Guha | 99692239634
D-1801 | Mr. Ravi Kant | 9892860469

WING E
E-201 | (Vacant) | 9820648998
E-202 | Dilip Lalji Bhai Vaviya | 9869795158
E-401 | Yogesh Patnakr | 9818690824
E-402 | Gaurav Jain | 9969224179
E-501 | Himanshu Das | 9821041796
E-602 | Mr. Rajindra Bhadana | 9967088854
E-1201 | Mr. Manoj Govind Barvadiya | 9969228955
E-1202 | Mr. Pallavi Pandey | 9969220266
E-1402 | Henmant G Dudle | 9869282332
E-1502 | Mr. Manish S Chaudhari | 9833690268
E-1602 | Vijaya Laxmi O P Naidu | 9820211670

WING F
F-201 | Rishikesh .D Malkhede | 9892501550
F-301 | Mr. Abhishek Kumar | 9833886624
F-403 | Saurav Gupta | 7045846563
F-503 | Mr. Abhinandan Kumar | 9410390947 / 9022612344
F-601 | Mrs. Varshney Divya | 8971775163
F-702 | Mr. Animesh Gayen | 9967437740
F-703 | Ganapatrao L. Pawar | 9967145474 / 8108791874
F-1002 | Pratik Kharpuriya | 7652088368
F-1101 | Naresh Kumar | 9769412577
F-1102 | Suraj Uniyal | 9820196030
F-1103 | Mr. Shriyan Namrata | 9869054250
F-1201 | Shilpa Niraj Varma | 9820418244
F-1203 | Mrs. Minal V. Tulsian | 9969224368
F-1301 | Ashish Debath | 9820757840
F-1303 | Ranjit Gogoi | 9820233087
F-1401 | Mr. Amit Hemraj Bhanushali | 9999649900
F-1501 | Mr. Panigrahy Saroj Kumar | 9819878143
F-1603 | Mr. Aveg Srivastava | 
F-1703 | Mrs. Aparna Dinak | 
"""

def parse():
    current_wing = ""
    users = {}
    
    # Static accounts
    static_users = [
        {"id": "chairman-1", "name": "Chairman", "email": "chairman@patelheritage.com", "phone": "+91 98765 43211", "flat": "B301", "role": "chairman", "password": "chairman123"},
        {"id": "secretary-1", "name": "Secretary", "email": "secretary@patelheritage.com", "phone": "+91 98765 43212", "flat": "C401", "role": "secretary", "password": "secretary123"},
        {"id": "security-1", "name": "Security Guard", "email": "security@patelheritage.com", "phone": "+91 98765 43215", "flat": "Security", "role": "security", "password": "security123"},
        {"id": "cook-1", "name": "Cook", "email": "cook@patelheritage.com", "phone": "+91 98765 43216", "flat": "Kitchen", "role": "cook", "password": "cook123"}
    ]
    
    for line in owners_raw.strip().split('\n'):
        line = line.strip()
        if not line: continue
        if line.startswith("WING"):
            current_wing = line.split(" ")[1]
            continue
        
        parts = [p.strip() for p in line.split("|")]
        if len(parts) >= 3:
            flat_num = parts[0]
            name = parts[1]
            phone = parts[2]
            
            flat_id = f"{current_wing}{flat_num}"
            users[flat_id] = {
                "id": flat_id,
                "name": name,
                "email": f"{flat_id.lower()}@patelheritage.com",
                "phone": phone,
                "flat": flat_id,
                "role": "resident",
                "password": "123"
            }

    # Add tenants
    current_wing = ""
    for line in tenants_raw.strip().split('\n'):
        line = line.strip()
        if not line: continue
        if line.startswith("WING"):
            current_wing = line.split(" ")[1]
            continue
        
        parts = [p.strip() for p in line.split("|")]
        if len(parts) >= 2:
            flat_id = parts[0].replace("-", "")
            name = parts[1]
            phone = parts[2] if len(parts) > 2 else ""
            
            if "(Vacant)" in name: continue
            
            if flat_id in users:
                users[flat_id]["tenantName"] = name
                users[flat_id]["tenantPhone"] = phone
            else:
                # Flat exists in tenants but not owners? Create base user.
                users[flat_id] = {
                    "id": flat_id,
                    "name": "Owner " + flat_id,
                    "email": f"{flat_id.lower()}@patelheritage.com",
                    "phone": "+91 98765 43210",
                    "flat": flat_id,
                    "role": "resident",
                    "password": "123",
                    "tenantName": name,
                    "tenantPhone": phone
                }

    all_users = static_users + list(users.values())
    return all_users

def update_file(all_users):
    with open('lib/auth.ts', 'r') as f:
        content = f.read()

    start_marker = 'const MOCK_USERS: UserWithPassword[] = ['
    end_marker = '];'
    
    start_pos = content.find(start_marker) + len(start_marker) - 1
    end_pos = content.find(end_marker, start_pos) + 1
    
    formatted_json = json.dumps(all_users, indent=2)
    
    final_content = content[:start_pos] + formatted_json + content[end_pos:]
    
    with open('lib/auth.ts', 'w') as f:
        f.write(final_content)

users = parse()
update_file(users)
print(f"Successfully updated {len(users)} users.")
