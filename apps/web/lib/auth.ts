import { User, WingConfig } from '@/types';
import { WING_CONFIGS } from './constants';

// User database with flat-based IDs and passwords
interface UserWithPassword extends User {
  password: string;
}

const MOCK_USERS: UserWithPassword[] = [
  {
    "id": "chairman-1",
    "name": "Chairman",
    "email": "chairman@patelheritage.com",
    "phone": "+91 98765 43211",
    "flat": "B301",
    "role": "chairman",
    "password": "chairman123"
  },
  {
    "id": "secretary-1",
    "name": "Secretary (Mr. Dinesh Kanji Choudhary)",
    "email": "f1302@patelheritage.com",
    "phone": "9819131072",
    "flat": "F1302",
    "role": "secretary",
    "password": "secretary123"
  },
  {
    "id": "security-1",
    "name": "Security Guard",
    "email": "security@patelheritage.com",
    "phone": "+91 98765 43215",
    "flat": "Security",
    "role": "security",
    "password": "security123"
  },
  {
    "id": "cook-1",
    "name": "Cook",
    "email": "cook@patelheritage.com",
    "phone": "+91 98765 43216",
    "flat": "Kitchen",
    "role": "cook",
    "password": "cook123"
  },
  {
    "id": "A201",
    "name": "Mr. vinod gupta",
    "email": "a201@patelheritage.com",
    "phone": "8789268968",
    "flat": "A201",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "A202",
    "name": "Mrs. Nandini Dubey & Mr. Dhiraj Rajeshwar Prasad Dubey",
    "email": "a202@patelheritage.com",
    "phone": "9833999127",
    "flat": "A202",
    "role": "resident",
    "password": "123",
    "tenantName": "Mr. Atul Modi",
    "tenantPhone": "9821023697"
  },
  {
    "id": "A203",
    "name": "Mr. Prakash Jethanand Kella & Mrs. Urmila Prakash Kella",
    "email": "a203@patelheritage.com",
    "phone": "9099037126",
    "flat": "A203",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "A301",
    "name": "Mr. K. G. Prasad & Mrs. P. Sathya",
    "email": "a301@patelheritage.com",
    "phone": "9167006403",
    "flat": "A301",
    "role": "resident",
    "password": "123",
    "tenantName": "Mr. Hemant Kumar Rawat",
    "tenantPhone": "9167006403"
  },
  {
    "id": "A302",
    "name": "Mrs. Veena Chandnarayan Tiku & Mr. Chandnarayan Trilok Tiku",
    "email": "a302@patelheritage.com",
    "phone": "9819412560",
    "flat": "A302",
    "role": "resident",
    "password": "123",
    "tenantName": "Mr. Balasankula Uday Bhaskar Rao",
    "tenantPhone": "9819412560"
  },
  {
    "id": "A303",
    "name": "Mr. Satish Pandita & Mrs. Monika Pandita",
    "email": "a303@patelheritage.com",
    "phone": "9819412560",
    "flat": "A303",
    "role": "resident",
    "password": "123",
    "tenantName": "Rahul Choudhry",
    "tenantPhone": "9819412560"
  },
  {
    "id": "A401",
    "name": "Mr. K. V. Hoizal & Mrs. Rashmi Hoizal",
    "email": "a401@patelheritage.com",
    "phone": "9969226448",
    "flat": "A401",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "A402",
    "name": "Mr. Paritosh Barui & Mrs. Basabdatta Barui",
    "email": "a402@patelheritage.com",
    "phone": "9769948692",
    "flat": "A402",
    "role": "resident",
    "password": "123",
    "tenantName": "Mr. Deepika Tukaram Dudhe",
    "tenantPhone": "9769948692"
  },
  {
    "id": "A403",
    "name": "Mr. Tushar Premnath Sonawane / Mrs. Swati Tushar Sonawane",
    "email": "a403@patelheritage.com",
    "phone": "9769989972",
    "flat": "A403",
    "role": "resident",
    "password": "123",
    "tenantName": "Mr. Siddharth Gupta",
    "tenantPhone": "9769989972"
  },
  {
    "id": "A501",
    "name": "Mr. Arvind Prasad Mishra & Mrs. Sapna Arvind Mishra",
    "email": "a501@patelheritage.com",
    "phone": "9819007859",
    "flat": "A501",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "A502",
    "name": "Mr. Vinod Hardwar Singh & Mrs. Sangeeta Vinod Singh",
    "email": "a502@patelheritage.com",
    "phone": "9004413925",
    "flat": "A502",
    "role": "resident",
    "password": "123",
    "tenantName": "Jaydeep Bithare",
    "tenantPhone": "9004413925"
  },
  {
    "id": "A503",
    "name": "Mr. Vidya Sagar Prasad",
    "email": "a503@patelheritage.com",
    "phone": "9892313625",
    "flat": "A503",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "A601",
    "name": "Mrs. Amrutben Jethalal Patel (Gandhi) & Mr. Jethalal Kanji Patel(Gandhi)",
    "email": "a601@patelheritage.com",
    "phone": "9920406103",
    "flat": "A601",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "A602",
    "name": "Mr. Sarvesh Chandra Pandey & Mrs. Neelam Pandey",
    "email": "a602@patelheritage.com",
    "phone": "9969228333",
    "flat": "A602",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "A603",
    "name": "Mr. Kamala Ramjanam Singh",
    "email": "a603@patelheritage.com",
    "phone": "8082021865",
    "flat": "A603",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "A701",
    "name": "Mr. Deshraj Singh & Mrs. Sharda Singh",
    "email": "a701@patelheritage.com",
    "phone": "9969226413",
    "flat": "A701",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "A702",
    "name": "Mr. Srikant Singh",
    "email": "a702@patelheritage.com",
    "phone": "9869327237",
    "flat": "A702",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "A703",
    "name": "Mr. Om Prakash Singh",
    "email": "a703@patelheritage.com",
    "phone": "9757012276",
    "flat": "A703",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "A801",
    "name": "Mr. Saumen Ghosh & Mrs. Lipika Ghosh",
    "email": "a801@patelheritage.com",
    "phone": "9804939192",
    "flat": "A801",
    "role": "resident",
    "password": "123",
    "tenantName": "Chandra Praksh",
    "tenantPhone": "9804939192"
  },
  {
    "id": "A802",
    "name": "Dr. Om Prakash Rajput & Mrs. Geeta Rajput",
    "email": "a802@patelheritage.com",
    "phone": "7710091747",
    "flat": "A802",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "A803",
    "name": "Mr. Arun Kumar Saxena & Mrs. Rashmi Saxena",
    "email": "a803@patelheritage.com",
    "phone": "9969228324",
    "flat": "A803",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "A901",
    "name": "Mr. Ramdev Chowdhary & Mrs. Jeeya Chowdhary",
    "email": "a901@patelheritage.com",
    "phone": "9969224545",
    "flat": "A901",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "A902",
    "name": "Mr. Ashok Kumar Srivastava & Mrs. Prakrati",
    "email": "a902@patelheritage.com",
    "phone": "8108781874",
    "flat": "A902",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "A903",
    "name": "Mr. Rakesh Kumar",
    "email": "a903@patelheritage.com",
    "phone": "9969224359",
    "flat": "A903",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "A1001",
    "name": "Mr. Gunturu Sreenivasa Babu & Mrs. Gunturu Annapurna",
    "email": "a1001@patelheritage.com",
    "phone": "9819330248",
    "flat": "A1001",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "A1002",
    "name": "Mr. Praveen Chandak & Mrs. Deepika Chandak",
    "email": "a1002@patelheritage.com",
    "phone": "9649999260",
    "flat": "A1002",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "A1003",
    "name": "Mr. Kamdeo Tukaram Khandekar & Mrs. Ujwala Kamdeo Khandekar",
    "email": "a1003@patelheritage.com",
    "phone": "9820974740",
    "flat": "A1003",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "A1101",
    "name": "Mr. Vinod Bhikaji Rane",
    "email": "a1101@patelheritage.com",
    "phone": "9987722970",
    "flat": "A1101",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "A1102",
    "name": "Mr. Rajendra Vasudeo Sali",
    "email": "a1102@patelheritage.com",
    "phone": "9967870138",
    "flat": "A1102",
    "role": "resident",
    "password": "123",
    "tenantName": "Sibabrata Choudhury",
    "tenantPhone": "9967870138"
  },
  {
    "id": "A1103",
    "name": "Mr. Namdev Dnyanu Salunkhe",
    "email": "a1103@patelheritage.com",
    "phone": "9821019151",
    "flat": "A1103",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "A1201",
    "name": "Mr. Rajeev Kumar Sood",
    "email": "a1201@patelheritage.com",
    "phone": "66818464527",
    "flat": "A1201",
    "role": "resident",
    "password": "123",
    "tenantName": "Mr. Shylesh Sivadasan",
    "tenantPhone": "9871978883"
  },
  {
    "id": "A1202",
    "name": "Mr. Rudra Dev Gaur & Mrs. Aasha Gaur",
    "email": "a1202@patelheritage.com",
    "phone": "9969223201",
    "flat": "A1202",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "A1203",
    "name": "Mrs. Ranjana Sood Choudhary",
    "email": "a1203@patelheritage.com",
    "phone": "9969224345",
    "flat": "A1203",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "A1301",
    "name": "Mrs. S. Anuradha & Mr. S. Krishnan",
    "email": "a1301@patelheritage.com",
    "phone": "9967570472",
    "flat": "A1301",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "A1302",
    "name": "Mr.Niraj Tiwari & Mr. Omprakash Tiwari",
    "email": "a1302@patelheritage.com",
    "phone": "8422999124",
    "flat": "A1302",
    "role": "resident",
    "password": "123",
    "tenantName": "Capt. Shailesh Awasthi",
    "tenantPhone": "9768011109"
  },
  {
    "id": "A1303",
    "name": "Mr. S. Krishnan & Mrs. Geeta Krishnan",
    "email": "a1303@patelheritage.com",
    "phone": "9967570472",
    "flat": "A1303",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "A1401",
    "name": "Mr. Alok Rathore & Mr. Yogendra Singh Rathore",
    "email": "a1401@patelheritage.com",
    "phone": "9930116528",
    "flat": "A1401",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "A1402",
    "name": "Mr. Rajeev Kumar & Mrs. Anju Prasad",
    "email": "a1402@patelheritage.com",
    "phone": "9892141034",
    "flat": "A1402",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "A1403",
    "name": "Mr. Ashok Puthukulangara Mukundan & Mrs. Vidya Ashok Mukundan",
    "email": "a1403@patelheritage.com",
    "phone": "9869222321",
    "flat": "A1403",
    "role": "resident",
    "password": "123",
    "tenantName": "Mr. Denesam Gunasekaran",
    "tenantPhone": "8891427205"
  },
  {
    "id": "A1501",
    "name": "Mr. Sainath Pandhrinath Pawaskar & Mr. Abhishek Sainath Pawaskar",
    "email": "a1501@patelheritage.com",
    "phone": "9867375983",
    "flat": "A1501",
    "role": "resident",
    "password": "123",
    "tenantName": "Aditya Jha",
    "tenantPhone": "9867375983"
  },
  {
    "id": "A1502",
    "name": "Mr. Rajender Arora & Mr. Sanjay",
    "email": "a1502@patelheritage.com",
    "phone": "9810507449",
    "flat": "A1502",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "A1503",
    "name": "Mr Mukul Kumar Agrawal & Mrs. Nidhi Agrawal",
    "email": "a1503@patelheritage.com",
    "phone": "9999649800",
    "flat": "A1503",
    "role": "resident",
    "password": "123",
    "tenantName": "Gelabikumar Harikrishrbhai Modi",
    "tenantPhone": "9004389112"
  },
  {
    "id": "A1601",
    "name": "Mr. Satish Shrimali & Mrs. Neena Shrimali",
    "email": "a1601@patelheritage.com",
    "phone": "9414307329",
    "flat": "A1601",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "A1602",
    "name": "Mr.S.A.Naikwadi",
    "email": "a1602@patelheritage.com",
    "phone": "9892895742",
    "flat": "A1602",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "A1603",
    "name": "Mrs. Mohini Rajendra Shandilya & Mr. Rajendra Krishna Shandilya",
    "email": "a1603@patelheritage.com",
    "phone": "9969015945",
    "flat": "A1603",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "A1701",
    "name": "Mrs. Sudha Sanjiva & Mr. Guruprasad Ramachar Sanjiva",
    "email": "a1701@patelheritage.com",
    "phone": "9022799600",
    "flat": "A1701",
    "role": "resident",
    "password": "123",
    "tenantName": "Subhendu Sekher Manna",
    "tenantPhone": "9022799600"
  },
  {
    "id": "A1702",
    "name": "Mr. Kulbir Singh Sant Singh Thandhi",
    "email": "a1702@patelheritage.com",
    "phone": "9820805496",
    "flat": "A1702",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "A1703",
    "name": "Mr. Jangala Rajendra Babu & Mrs. Jangala Santhi Priya",
    "email": "a1703@patelheritage.com",
    "phone": "9969220182",
    "flat": "A1703",
    "role": "resident",
    "password": "123",
    "tenantName": "Sibprasad Ray",
    "tenantPhone": "9969220182"
  },
  {
    "id": "B201",
    "name": "Pravin Kumar Vallabh Das Pethani",
    "email": "b201@patelheritage.com",
    "phone": "9322298823",
    "flat": "B201",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "B202",
    "name": "Mr. Rameshchandra Petha Vora & Mr. Dinesh Pethabhai Vora",
    "email": "b202@patelheritage.com",
    "phone": "9930550360",
    "flat": "B202",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "B301",
    "name": "Mr. Charanjeev Singh Obhan & Mrs. Kanwaljeet Kaur",
    "email": "b301@patelheritage.com",
    "phone": "7045489778",
    "flat": "B301",
    "role": "resident",
    "password": "123",
    "tenantName": "Mr. Manoj Sharma",
    "tenantPhone": "7045489778"
  },
  {
    "id": "B302",
    "name": "Mr. Dilpreet Singh Obhan & Mr. Amarjeet Singh Obhan & Mrs. Kanwaljeet Kaur Obhan",
    "email": "b302@patelheritage.com",
    "phone": "7045489778",
    "flat": "B302",
    "role": "resident",
    "password": "123",
    "tenantName": "Manish Gupta",
    "tenantPhone": "7045489778"
  },
  {
    "id": "B401",
    "name": "Mr. Dinesh Sopan Choudhari & Mrs. Purnima Dinesh Choudhari",
    "email": "b401@patelheritage.com",
    "phone": "9167670402",
    "flat": "B401",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "B402",
    "name": "Mr. Ashish Anand Singhal & Mrs. Ruby Ashish Singhal",
    "email": "b402@patelheritage.com",
    "phone": "9004559587",
    "flat": "B402",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "B501",
    "name": "Mr. Sunil G. Kriplani & Mrs. Varsha S. Kriplani",
    "email": "b501@patelheritage.com",
    "phone": "7715935590",
    "flat": "B501",
    "role": "resident",
    "password": "123",
    "tenantName": "Mr. Ateet Wagh",
    "tenantPhone": "7715935590 / 7227953287"
  },
  {
    "id": "B502",
    "name": "Ms. Vrushali J. Gandhi",
    "email": "b502@patelheritage.com",
    "phone": "9930738409",
    "flat": "B502",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "B601",
    "name": "Mr. Satyendra Rai",
    "email": "b601@patelheritage.com",
    "phone": "9969226134",
    "flat": "B601",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "B602",
    "name": "Mr. R. Balaji",
    "email": "b602@patelheritage.com",
    "phone": "9969225306",
    "flat": "B602",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "B701",
    "name": "Mrs. Suniti Singh & Ms. Shruti Singh",
    "email": "b701@patelheritage.com",
    "phone": "9320201242",
    "flat": "B701",
    "role": "resident",
    "password": "123",
    "tenantName": "Puthucode Gopalkrishnan",
    "tenantPhone": "9320201242"
  },
  {
    "id": "B702",
    "name": "Mr. Suresh Chand & Mrs. Hemlata Bharti",
    "email": "b702@patelheritage.com",
    "phone": "9969224730",
    "flat": "B702",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "B801",
    "name": "Kaberi Mazumder & Sanjay Kumar Mazumder",
    "email": "b801@patelheritage.com",
    "phone": "9965226238",
    "flat": "B801",
    "role": "resident",
    "password": "123",
    "tenantName": "Dr. Rajendra Khade",
    "tenantPhone": "9819415427"
  },
  {
    "id": "B802",
    "name": "Mr. Rajat Malhotra",
    "email": "b802@patelheritage.com",
    "phone": "9426614936",
    "flat": "B802",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "B901",
    "name": "Mr. Ramakant Mahadeo Auti & Mrs. Sudha Ramakant Auti",
    "email": "b901@patelheritage.com",
    "phone": "9821151924",
    "flat": "B901",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "B902",
    "name": "Mr. Ramakant Mahadeo Auti & Mrs. Sudha Ramakant Auti",
    "email": "b902@patelheritage.com",
    "phone": "9821151924",
    "flat": "B902",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "B1001",
    "name": "Mr. Rajib Kumar Dey & Mrs. Sutapa Dey",
    "email": "b1001@patelheritage.com",
    "phone": "9969228107",
    "flat": "B1001",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "B1002",
    "name": "Mr. M. A. A. Srinivas & Mrs. M. Indumathi Srinivas",
    "email": "b1002@patelheritage.com",
    "phone": "9969227625",
    "flat": "B1002",
    "role": "resident",
    "password": "123",
    "tenantName": "Mr. Vinod Ninnd Tembulkar",
    "tenantPhone": "9969227625"
  },
  {
    "id": "B1101",
    "name": "Mr. Shashikant Prabhakar Kumbhar",
    "email": "b1101@patelheritage.com",
    "phone": "9820427666",
    "flat": "B1101",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "B1102",
    "name": "Mrs. Seema Shashikant Kumbhar",
    "email": "b1102@patelheritage.com",
    "phone": "9820427666",
    "flat": "B1102",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "B1201",
    "name": "Mr. Vinod Kumar Chhabra & Dr. (Mrs.) Nita Chhabra",
    "email": "b1201@patelheritage.com",
    "phone": "9969223202",
    "flat": "B1201",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "B1202",
    "name": "Mr. Rameshwar Prasad Kuldeep",
    "email": "b1202@patelheritage.com",
    "phone": "9969226521",
    "flat": "B1202",
    "role": "resident",
    "password": "123",
    "tenantName": "Satinder Singh",
    "tenantPhone": "9969226521"
  },
  {
    "id": "B1301",
    "name": "Mr. Pradeep Kumar Porwad & Mrs. Sangeetha Porwad",
    "email": "b1301@patelheritage.com",
    "phone": "9821193517",
    "flat": "B1301",
    "role": "resident",
    "password": "123",
    "tenantName": "Sunil Kothari",
    "tenantPhone": "9821193517"
  },
  {
    "id": "B1302",
    "name": "Mr. Dayanand Maruti Jawalikar & Mr. Vithalrao Shankarrao Shinde",
    "email": "b1302@patelheritage.com",
    "phone": "9870407720",
    "flat": "B1302",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "B1401",
    "name": "Mr. Manmohan Garhwal",
    "email": "b1401@patelheritage.com",
    "phone": "7045333077",
    "flat": "B1401",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "B1402",
    "name": "Mrs. Vibha Manmohan Garhwal",
    "email": "b1402@patelheritage.com",
    "phone": "7045333077",
    "flat": "B1402",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "B1501",
    "name": "Mr. Deepak Kumar & Mrs. Sushma Pal",
    "email": "b1501@patelheritage.com",
    "phone": "9833098932",
    "flat": "B1501",
    "role": "resident",
    "password": "123",
    "tenantName": "Mr. Ankur Garg",
    "tenantPhone": "996922120"
  },
  {
    "id": "B1502",
    "name": "Mr. Karanam Raghunath Hindapur & Mrs. Bharathi Raghunath",
    "email": "b1502@patelheritage.com",
    "phone": "7208692370",
    "flat": "B1502",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "B1601",
    "name": "Mr. Gajendra Singh & Mrs. Dhan Devi Singh",
    "email": "b1601@patelheritage.com",
    "phone": "8369109648",
    "flat": "B1601",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "B1602",
    "name": "Mr. Pradeep Singh Nagesh",
    "email": "b1602@patelheritage.com",
    "phone": "9987445597",
    "flat": "B1602",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "B1701",
    "name": "Mr. Prakash P. Kamerkar & Mrs. Pradnya P. Kamerkar",
    "email": "b1701@patelheritage.com",
    "phone": "9540994515",
    "flat": "B1701",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "B1702",
    "name": "Mrs. Usha Bhaskar Dhatavkar",
    "email": "b1702@patelheritage.com",
    "phone": "9969233506",
    "flat": "B1702",
    "role": "resident",
    "password": "123",
    "tenantName": "Mr. Arjun Narayan Kadam",
    "tenantPhone": "9969233506"
  },
  {
    "id": "B1801",
    "name": "Mrs. Ramavati Premprasad Varma",
    "email": "b1801@patelheritage.com",
    "phone": "9699807001",
    "flat": "B1801",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "B1802",
    "name": "Mrs. Neelu Satyarthi",
    "email": "b1802@patelheritage.com",
    "phone": "9412249199",
    "flat": "B1802",
    "role": "resident",
    "password": "123",
    "tenantName": "Mrs. Saugata Sukumar Biswas",
    "tenantPhone": "9426614242"
  },
  {
    "id": "B1901",
    "name": "Mrs. Vanita Umesh Munde & Mr. Umesh Sadashive Munde",
    "email": "b1901@patelheritage.com",
    "phone": "9987647330",
    "flat": "B1901",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "C201",
    "name": "Mr. Rajshekhar S. Hiremath, Mr. Somashekhar Hiremath & Mrs. Pruthvi Hiremath",
    "email": "c201@patelheritage.com",
    "phone": "7021820997",
    "flat": "C201",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "C202",
    "name": "Mrs. Neela Baban Satpute",
    "email": "c202@patelheritage.com",
    "phone": "9579714477",
    "flat": "C202",
    "role": "resident",
    "password": "123",
    "tenantName": "Umesh Kumar Panday",
    "tenantPhone": "9579714477"
  },
  {
    "id": "C301",
    "name": "Ms. Manisha Sharad Ahire",
    "email": "c301@patelheritage.com",
    "phone": "9892014873",
    "flat": "C301",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "C302",
    "name": "Mr. Panchaksharaiah P. M. & Mrs. Sheela Panchakshari",
    "email": "c302@patelheritage.com",
    "phone": "9833292834",
    "flat": "C302",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "C401",
    "name": "Mr. Sarabjeet Singh Matharu",
    "email": "c401@patelheritage.com",
    "phone": "9823025829",
    "flat": "C401",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "C402",
    "name": "Mr. Balakrishnan P. K. & Mrs. Raji Balakrishnan",
    "email": "c402@patelheritage.com",
    "phone": "9820002559",
    "flat": "C402",
    "role": "resident",
    "password": "123",
    "tenantName": "Mrs. Vidya Amrut Mety",
    "tenantPhone": "9892014873 / 9820002559"
  },
  {
    "id": "C501",
    "name": "Mr. Kishor S. Rao",
    "email": "c501@patelheritage.com",
    "phone": "9821070516",
    "flat": "C501",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "C502",
    "name": "Mr. Suresh M. Pingle & Mrs. Rajashri Suresh Pingle",
    "email": "c502@patelheritage.com",
    "phone": "9892000219",
    "flat": "C502",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "C601",
    "name": "Dr. Prabha Rani Singh",
    "email": "c601@patelheritage.com",
    "phone": "9113304574",
    "flat": "C601",
    "role": "resident",
    "password": "123",
    "tenantName": "Mr. Laxman Devaji Vaviya",
    "tenantPhone": "9372790056"
  },
  {
    "id": "C602",
    "name": "Mr. Nandkishor Madhavrao Patil",
    "email": "c602@patelheritage.com",
    "phone": "9223289276",
    "flat": "C602",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "C701",
    "name": "Mr. Vimal Gaurishankar Barot, Mrs. Aarti Vimal Barot & Mr. Gaurishankar Ghelabhai Barot",
    "email": "c701@patelheritage.com",
    "phone": "9820080525",
    "flat": "C701",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "C702",
    "name": "Mr.Neeraj Sharma",
    "email": "c702@patelheritage.com",
    "phone": "9969229171",
    "flat": "C702",
    "role": "resident",
    "password": "123",
    "tenantName": "Mr. Sailesh Patel",
    "tenantPhone": "9969229171"
  },
  {
    "id": "C801",
    "name": "Mrs. Usha Shivaji Jagadale",
    "email": "c801@patelheritage.com",
    "phone": "9702941041",
    "flat": "C801",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "C802",
    "name": "Mr. Vijay M. Pingle & Mrs. Sujata Vijay Pingle",
    "email": "c802@patelheritage.com",
    "phone": "9892478173",
    "flat": "C802",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "C901",
    "name": "Mrs. Prabha S. Pandey",
    "email": "c901@patelheritage.com",
    "phone": "9930450541",
    "flat": "C901",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "C902",
    "name": "Mr. Paras Jain & Mrs. Sangita Jain",
    "email": "c902@patelheritage.com",
    "phone": "9820107811",
    "flat": "C902",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "C1001",
    "name": "Mr. Sameer Singh & Mrs. Sadhvi Singh",
    "email": "c1001@patelheritage.com",
    "phone": "9820059254",
    "flat": "C1001",
    "role": "resident",
    "password": "123",
    "tenantName": "Mrs. Devayani Nitin Phadke",
    "tenantPhone": "9820059254"
  },
  {
    "id": "C1002",
    "name": "Dr. L. S. Poonja",
    "email": "c1002@patelheritage.com",
    "phone": "9821972704",
    "flat": "C1002",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "C1101",
    "name": "Mr. Suresh Chottu Deol & Mrs. Geeta Suresh Deol",
    "email": "c1101@patelheritage.com",
    "phone": "9820028239",
    "flat": "C1101",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "C1102",
    "name": "Mr. Satish Kumar Munshi",
    "email": "c1102@patelheritage.com",
    "phone": "9867945088",
    "flat": "C1102",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "C1201",
    "name": "Mr. Nitin Das",
    "email": "c1201@patelheritage.com",
    "phone": "9930945213",
    "flat": "C1201",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "C1202",
    "name": "Mrs. Ashwini Ratnakant Inamdar",
    "email": "c1202@patelheritage.com",
    "phone": "8805648748",
    "flat": "C1202",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "C1301",
    "name": "Mrs. Priyadarshini Dinesh Shetty Mr. Dinesh Shetty",
    "email": "c1301@patelheritage.com",
    "phone": "9833155591",
    "flat": "C1301",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "C1302",
    "name": "Mrs. Nandini Vaibhav Naikawadi",
    "email": "c1302@patelheritage.com",
    "phone": "9321240962",
    "flat": "C1302",
    "role": "resident",
    "password": "123",
    "tenantName": "Mr. Bharadawad Masikar",
    "tenantPhone": "9321240962 / 9560446188"
  },
  {
    "id": "C1401",
    "name": "Mr. Prakash B. Ahuja / Mrs. Lenna P. Ahuja",
    "email": "c1401@patelheritage.com",
    "phone": "9820100124",
    "flat": "C1401",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "C1402",
    "name": "Mr. Shishir Harishchandra Hattewar & Mrs. Nutan Shishir Hattewar",
    "email": "c1402@patelheritage.com",
    "phone": "9435715533",
    "flat": "C1402",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "C1501",
    "name": "Mr. Vinod Manik Kavle / Mrs. Priyanka Vinod Kavle / Mrs. Kamal Manik Kavle",
    "email": "c1501@patelheritage.com",
    "phone": "9967331204",
    "flat": "C1501",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "C1502",
    "name": "Mr.Kailash B. Nikam / Mrs. Vaishali K. Nikam",
    "email": "c1502@patelheritage.com",
    "phone": "9833390957",
    "flat": "C1502",
    "role": "resident",
    "password": "123",
    "tenantName": "Alpa Srivastava",
    "tenantPhone": "8591422976"
  },
  {
    "id": "C1601",
    "name": "Mr Vijay M Pingle",
    "email": "c1601@patelheritage.com",
    "phone": "9892478173",
    "flat": "C1601",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "C1602",
    "name": "Mr. Neeraj Jain",
    "email": "c1602@patelheritage.com",
    "phone": "9820455541",
    "flat": "C1602",
    "role": "resident",
    "password": "123",
    "tenantName": "Mr. Omkar Jhadhav",
    "tenantPhone": "9820455541"
  },
  {
    "id": "C1701",
    "name": "Mr.P.N.Tripathi",
    "email": "c1701@patelheritage.com",
    "phone": "9819311648",
    "flat": "C1701",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "C1702",
    "name": "Mr. Sanjay Bhaskar Nikam",
    "email": "c1702@patelheritage.com",
    "phone": "9324603944",
    "flat": "C1702",
    "role": "resident",
    "password": "123",
    "tenantName": "Mr. Garai Suman",
    "tenantPhone": "9833654655"
  },
  {
    "id": "C1801",
    "name": "Mr. Amod Khare & Mrs. Monika Khare",
    "email": "c1801@patelheritage.com",
    "phone": "9833654655",
    "flat": "C1801",
    "role": "resident",
    "password": "123",
    "tenantName": "Mr. Pramod Agrawal",
    "tenantPhone": "9820094710"
  },
  {
    "id": "C1802",
    "name": "Mrs.Sarita Upadhyay & Mr. Ashok Kumar",
    "email": "c1802@patelheritage.com",
    "phone": "7814035564",
    "flat": "C1802",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "C1901",
    "name": "Mrs. Rekha Singh & Mr. Ravindrapal Singh",
    "email": "c1901@patelheritage.com",
    "phone": "9869054250",
    "flat": "C1901",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "D201",
    "name": "Mr. Devraj Manji Barvadiya / Mrs. Amarben Devraj Barvadiya",
    "email": "d201@patelheritage.com",
    "phone": "9920259692",
    "flat": "D201",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "D202",
    "name": "Amrutlal Malla Patel (Patni)",
    "email": "d202@patelheritage.com",
    "phone": "9892770550",
    "flat": "D202",
    "role": "resident",
    "password": "123",
    "tenantName": "Komal C. Patel",
    "tenantPhone": "9819194395"
  },
  {
    "id": "D301",
    "name": "Mrs. Ruchee Agarwal & Mr. Akshdeep Suresh Agarwal",
    "email": "d301@patelheritage.com",
    "phone": "9819194395",
    "flat": "D301",
    "role": "resident",
    "password": "123",
    "tenantName": "Dr. Swati Mane",
    "tenantPhone": "9969227621"
  },
  {
    "id": "D302",
    "name": "Mr. Umesh Chandra Bhatt & Mrs. Neeru Bhatt",
    "email": "d302@patelheritage.com",
    "phone": "9869121836",
    "flat": "D302",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "D401",
    "name": "Mr. Veldanda Venkateshwar Rao & Mrs. Veldanda Sukeshini",
    "email": "d401@patelheritage.com",
    "phone": "9969227621",
    "flat": "D401",
    "role": "resident",
    "password": "123",
    "tenantName": "Mr. Ravi Gupta",
    "tenantPhone": "7042191478"
  },
  {
    "id": "D402",
    "name": "Mrs. Bharati Kulshrestha",
    "email": "d402@patelheritage.com",
    "phone": "7042191478",
    "flat": "D402",
    "role": "resident",
    "password": "123",
    "tenantName": "Mr. Vijay Anand & Mrs. Shanu Sinha",
    "tenantPhone": "8802999322"
  },
  {
    "id": "D501",
    "name": "Mr. Manoj Kumar Sahu & Mrs. Sudha Manoj Sahu",
    "email": "d501@patelheritage.com",
    "phone": "9594965083",
    "flat": "D501",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "D502",
    "name": "mrs sonali koli",
    "email": "d502@patelheritage.com",
    "phone": "7900109950",
    "flat": "D502",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "D601",
    "name": "Mr. Chandrakant Ghelabhai Barot & Mr. Pravinchandra Ghelabhai Barot",
    "email": "d601@patelheritage.com",
    "phone": "9820486999",
    "flat": "D601",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "D602",
    "name": "Mr.Kamlesh Mehata & Mrs. Hemali Kamlesh Mehata",
    "email": "d602@patelheritage.com",
    "phone": "9326024105",
    "flat": "D602",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "D701",
    "name": "Mr. Narshi Gela Ravat (Patel) & Mrs. Kamuben Narshi Ravat (Patel)",
    "email": "d701@patelheritage.com",
    "phone": "9820244396",
    "flat": "D701",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "D702",
    "name": "Mr. Jatinder Sahni & Mrs. Kavita Sahni",
    "email": "d702@patelheritage.com",
    "phone": "9004268108",
    "flat": "D702",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "D801",
    "name": "Mr. Rohit Garg & Mrs. Minakshi Garg",
    "email": "d801@patelheritage.com",
    "phone": "9969220800",
    "flat": "D801",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "D802",
    "name": "Mrs. Dipti Singh",
    "email": "d802@patelheritage.com",
    "phone": "8802999322",
    "flat": "D802",
    "role": "resident",
    "password": "123",
    "tenantName": "Anoop V. Gopinathan",
    "tenantPhone": "9820624165"
  },
  {
    "id": "D901",
    "name": "Mr. Sanjay G Mayani Mrs.Sangeeta S Mayani",
    "email": "d901@patelheritage.com",
    "phone": "9819821616",
    "flat": "D901",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "D902",
    "name": "Mr. Vinay Tukaram Wakade & Mrs. Meena Vinay Wakade",
    "email": "d902@patelheritage.com",
    "phone": "8419976260",
    "flat": "D902",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "D1001",
    "name": "Mr. Davinder Singh Ahlawat",
    "email": "d1001@patelheritage.com",
    "phone": "9867090829",
    "flat": "D1001",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "D1002",
    "name": "Mr. Vijay Kumar",
    "email": "d1002@patelheritage.com",
    "phone": "9445005968",
    "flat": "D1002",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "D1101",
    "name": "Mrs. Alpa Gupta",
    "email": "d1101@patelheritage.com",
    "phone": "9223529361",
    "flat": "D1101",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "D1102",
    "name": "Mrs. Latha Reny Sam & Mr. Reny Sam Koshy",
    "email": "d1102@patelheritage.com",
    "phone": "9820624165",
    "flat": "D1102",
    "role": "resident",
    "password": "123",
    "tenantName": "Mr. Gaurav Choudhary",
    "tenantPhone": "9819878143"
  },
  {
    "id": "D1201",
    "name": "Mr. Jambunathan Raju & Mrs. Kala Raju",
    "email": "d1201@patelheritage.com",
    "phone": "9833848503",
    "flat": "D1201",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "D1202",
    "name": "Mr. Brahma Mall & Mrs. Meera Singh",
    "email": "d1202@patelheritage.com",
    "phone": "9819878143",
    "flat": "D1202",
    "role": "resident",
    "password": "123",
    "tenantName": "Mr. Tushar Srivastava",
    "tenantPhone": "9167542327"
  },
  {
    "id": "D1301",
    "name": "Mr. Rahul Kisan Patil",
    "email": "d1301@patelheritage.com",
    "phone": "9768114999",
    "flat": "D1301",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "D1302",
    "name": "Mr. Kisan Joma Patil",
    "email": "d1302@patelheritage.com",
    "phone": "9322351912",
    "flat": "D1302",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "D1401",
    "name": "Mr. Sarvesh Gaur",
    "email": "d1401@patelheritage.com",
    "phone": "9820316296",
    "flat": "D1401",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "D1402",
    "name": "Mr. Raghu Ambavi Patel & Mrs. Punjiben Raghu Patel",
    "email": "d1402@patelheritage.com",
    "phone": "9892809040",
    "flat": "D1402",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "D1501",
    "name": "Mrs. Gouri Prova Singh",
    "email": "d1501@patelheritage.com",
    "phone": "9892098216",
    "flat": "D1501",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "D1502",
    "name": "Mr. Vasant Nanji Patel / Mrs. Savita Vasant Pate;",
    "email": "d1502@patelheritage.com",
    "phone": "9819149178",
    "flat": "D1502",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "D1601",
    "name": "Mr. Shivaji Bhimaji Choudhary & Mrs. Suchita Shivaji Chaudhary",
    "email": "d1601@patelheritage.com",
    "phone": "9820196030",
    "flat": "D1601",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "D1602",
    "name": "Mr. Heem Dilip Ashar & Mrs. Sushma Prasad Ashar",
    "email": "d1602@patelheritage.com",
    "phone": "9167542327",
    "flat": "D1602",
    "role": "resident",
    "password": "123",
    "tenantName": "Mrs. Sanjana Deb Guha",
    "tenantPhone": "99692239634"
  },
  {
    "id": "D1701",
    "name": "Mr Ravindradas Padmanabhan & Mrs. Suprabha Ravindradas",
    "email": "d1701@patelheritage.com",
    "phone": "9820138753",
    "flat": "D1701",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "D1702",
    "name": "Mr. Suraj R Das & Mrs. Reeja S. Das",
    "email": "d1702@patelheritage.com",
    "phone": "9820103465",
    "flat": "D1702",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "D1801",
    "name": "Mr. Ravi Baidhyanath Prasad",
    "email": "d1801@patelheritage.com",
    "phone": "9969223204",
    "flat": "D1801",
    "role": "resident",
    "password": "123",
    "tenantName": "Mr. Ravi Kant",
    "tenantPhone": "9892860469"
  },
  {
    "id": "D1802",
    "name": "Mr. Laxman Devji Pate l & Mrs.Sati Laxman Vaviya & Mr.Haresh Devaji Vaviya",
    "email": "d1802@patelheritage.com",
    "phone": "9819946937",
    "flat": "D1802",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "D1901",
    "name": "Mr.Harji G Gajora & Mr.Ramesh H Gajora",
    "email": "d1901@patelheritage.com",
    "phone": "9930873387",
    "flat": "D1901",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "E201",
    "name": "Mr. Valji Karamshi Patel (Patni)",
    "email": "e201@patelheritage.com",
    "phone": "9820331328",
    "flat": "E201",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "E202",
    "name": "Mr. Kanji Karamshi Patel(Patni)",
    "email": "e202@patelheritage.com",
    "phone": "9920406103",
    "flat": "E202",
    "role": "resident",
    "password": "123",
    "tenantName": "Dilip Lalji Bhai Vaviya",
    "tenantPhone": "9869795158"
  },
  {
    "id": "E301",
    "name": "Mr. Girjesh Kumar Srivastava & Mrs. Surya Kumari Srivastava",
    "email": "e301@patelheritage.com",
    "phone": "9515108721",
    "flat": "E301",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "E302",
    "name": "Mr. Rajeev R. Nair, Mr. G. Radhakrishnan Nair & Mrs. Shanta R. Nair",
    "email": "e302@patelheritage.com",
    "phone": "9867668777",
    "flat": "E302",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "E401",
    "name": "Mr. Surinder K. Bhagat",
    "email": "e401@patelheritage.com",
    "phone": "9820081995",
    "flat": "E401",
    "role": "resident",
    "password": "123",
    "tenantName": "Yogesh Patnakr",
    "tenantPhone": "9818690824"
  },
  {
    "id": "E402",
    "name": "Mr. Raj Nandan & Mrs. Anjana Srivastava",
    "email": "e402@patelheritage.com",
    "phone": "9869795158",
    "flat": "E402",
    "role": "resident",
    "password": "123",
    "tenantName": "Gaurav Jain",
    "tenantPhone": "9969224179"
  },
  {
    "id": "E501",
    "name": "Mrs. Bimla Debi",
    "email": "e501@patelheritage.com",
    "phone": "9818690924",
    "flat": "E501",
    "role": "resident",
    "password": "123",
    "tenantName": "Himanshu Das",
    "tenantPhone": "9821041796"
  },
  {
    "id": "E502",
    "name": "Mr. Kamlesh Chandra Shrivastava & Mrs. Anu Shrivastava",
    "email": "e502@patelheritage.com",
    "phone": "7718893216",
    "flat": "E502",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "E601",
    "name": "Mr. Yele Balasaheb Tukaram",
    "email": "e601@patelheritage.com",
    "phone": "9987442647",
    "flat": "E601",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "E602",
    "name": "Mr. Seelamanthula Munikeswara Rao & Mrs. Seelamanthula Venkata Naga Vara Krishnaveni",
    "email": "e602@patelheritage.com",
    "phone": "9969224179",
    "flat": "E602",
    "role": "resident",
    "password": "123",
    "tenantName": "Mr. Rajindra Bhadana",
    "tenantPhone": "9967088854"
  },
  {
    "id": "E701",
    "name": "Mr. Rajender Vilas Kadam",
    "email": "e701@patelheritage.com",
    "phone": "9324544741",
    "flat": "E701",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "E702",
    "name": "Mrs. Padma Vilas Kadam",
    "email": "e702@patelheritage.com",
    "phone": "9324544741",
    "flat": "E702",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "E801",
    "name": "Mr. Vasant Mavji Patel & Mrs. Valiben Vasant Patel",
    "email": "e801@patelheritage.com",
    "phone": "9819074234",
    "flat": "E801",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "E802",
    "name": "Mr. Vijaykumar B Shete",
    "email": "e802@patelheritage.com",
    "phone": "9004022808",
    "flat": "E802",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "E901",
    "name": "Mr.Deepak Keshavrao Gadhave & Mrs. Sheetal Deepak Gadhave",
    "email": "e901@patelheritage.com",
    "phone": "9833026718",
    "flat": "E901",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "E902",
    "name": "Mrs. Girija Jaikumar",
    "email": "e902@patelheritage.com",
    "phone": "9619248086",
    "flat": "E902",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "E1001",
    "name": "Mr. Bhanji Raghavji Ravriya",
    "email": "e1001@patelheritage.com",
    "phone": "9930957788",
    "flat": "E1001",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "E1002",
    "name": "Mrs. Anita Bhanji Ravriya",
    "email": "e1002@patelheritage.com",
    "phone": "9320080048",
    "flat": "E1002",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "E1101",
    "name": "Mr. Sanjay Kumar Mazumder & Mrs. Kaberi Mazumder",
    "email": "e1101@patelheritage.com",
    "phone": "9969226238",
    "flat": "E1101",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "E1102",
    "name": "Mrs. Manju Goyal & Mr. Aman Goyal",
    "email": "e1102@patelheritage.com",
    "phone": "9825208236",
    "flat": "E1102",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "E1201",
    "name": "Mrs. Vibha Bhupen Doshi & Mr. Bhupen Pritamlal Doshi",
    "email": "e1201@patelheritage.com",
    "phone": "9821041796",
    "flat": "E1201",
    "role": "resident",
    "password": "123",
    "tenantName": "Mr. Manoj Govind Barvadiya",
    "tenantPhone": "9969228955"
  },
  {
    "id": "E1202",
    "name": "Mrs. Naina Prem Tripathi & Mr. Prem Nidhi Tripathi",
    "email": "e1202@patelheritage.com",
    "phone": "9819311648",
    "flat": "E1202",
    "role": "resident",
    "password": "123",
    "tenantName": "Mr. Pallavi Pandey",
    "tenantPhone": "9969220266"
  },
  {
    "id": "E1301",
    "name": "Mr.Nagraj Otaramji Chodhary & Mrs Shantidevi Nagraj Choudhary",
    "email": "e1301@patelheritage.com",
    "phone": "9322245078",
    "flat": "E1301",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "E1302",
    "name": "Mr.Pitaram P Choudhary & Mrs.Kamala P Choudhary",
    "email": "e1302@patelheritage.com",
    "phone": "9323181619",
    "flat": "E1302",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "E1401",
    "name": "Mr. Satbir Singh Arora & Mrs. Slinder Kaur Chowdhry",
    "email": "e1401@patelheritage.com",
    "phone": "9029221313",
    "flat": "E1401",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "E1402",
    "name": "Mr. Manepalli Srikrishna Sarma & Mrs. Manepalli Kameswari Devi",
    "email": "e1402@patelheritage.com",
    "phone": "9969228955",
    "flat": "E1402",
    "role": "resident",
    "password": "123",
    "tenantName": "Henmant G Dudle",
    "tenantPhone": "9869282332"
  },
  {
    "id": "E1501",
    "name": "Mr. Akshdeep Agarwal / Mrs. Ruchee A. Agarwal",
    "email": "e1501@patelheritage.com",
    "phone": "9819194395",
    "flat": "E1501",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "E1502",
    "name": "Mr. Jalla Narasimha Rao & Mrs. Jalla Aruna",
    "email": "e1502@patelheritage.com",
    "phone": "9619487551",
    "flat": "E1502",
    "role": "resident",
    "password": "123",
    "tenantName": "Mr. Manish S Chaudhari",
    "tenantPhone": "9833690268"
  },
  {
    "id": "E1601",
    "name": "Mr. Abhik Kumar Sen & Mrs. Kakoli Sen",
    "email": "e1601@patelheritage.com",
    "phone": "9820752726",
    "flat": "E1601",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "E1602",
    "name": "Mr. Pratha Satyanarayana & Mrs. Pratha Bharati",
    "email": "e1602@patelheritage.com",
    "phone": "9869282332",
    "flat": "E1602",
    "role": "resident",
    "password": "123",
    "tenantName": "Vijaya Laxmi O P Naidu",
    "tenantPhone": "9820211670"
  },
  {
    "id": "E1701",
    "name": "Mrs. Alka Jain & Mr. Neeraj Jain",
    "email": "e1701@patelheritage.com",
    "phone": "9820086571",
    "flat": "E1701",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "E1702",
    "name": "Dr.Prashant Nanasaheb Mohite",
    "email": "e1702@patelheritage.com",
    "phone": "9370411255",
    "flat": "E1702",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "E1801",
    "name": "Mr. Achalaram Amraramji Choudhary & Mr.Otaram Amraramji Choudhary",
    "email": "e1801@patelheritage.com",
    "phone": "9324493835",
    "flat": "E1801",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "E1802",
    "name": "Mr. Jayanti Govind Somani & Dhanwanti Jayanti Somani",
    "email": "e1802@patelheritage.com",
    "phone": "9987708822",
    "flat": "E1802",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "E1901",
    "name": "Mr. Sanjay Bhasker Nikam and Mr. Kailash Bhasker Nikam",
    "email": "e1901@patelheritage.com",
    "phone": "9833390957",
    "flat": "E1901",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "F201",
    "name": "Mr. Harish G. Parmani & Mr. Subhash G. Parmani",
    "email": "f201@patelheritage.com",
    "phone": "9833690268",
    "flat": "F201",
    "role": "resident",
    "password": "123",
    "tenantName": "Rishikesh .D Malkhede",
    "tenantPhone": "9892501550"
  },
  {
    "id": "F202",
    "name": "Mr.Prakash Bhiku Borhade & Mrs Manda Prakash Borhade",
    "email": "f202@patelheritage.com",
    "phone": "9867727062",
    "flat": "F202",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "F203",
    "name": "Mrs. Asha Arvind Telang & Mrs. Vrinda Rajan Hawal",
    "email": "f203@patelheritage.com",
    "phone": "9969437922",
    "flat": "F203",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "F301",
    "name": "Mr. Ashok Kumar Pandey",
    "email": "f301@patelheritage.com",
    "phone": "9820211670",
    "flat": "F301",
    "role": "resident",
    "password": "123",
    "tenantName": "Mr. Abhishek Kumar",
    "tenantPhone": "9833886624"
  },
  {
    "id": "F302",
    "name": "Mr. Anmol Shrimant Kamble",
    "email": "f302@patelheritage.com",
    "phone": "8433452303",
    "flat": "F302",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "F303",
    "name": "Mr. Pravin Kumar & Mrs. Kavita Kumar",
    "email": "f303@patelheritage.com",
    "phone": "9819150401",
    "flat": "F303",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "F401",
    "name": "Mr. Akshdeep Sureshchandra Agarwal & Mrs. Ruchee Akshdeep Agarwal",
    "email": "f401@patelheritage.com",
    "phone": "9773004456",
    "flat": "F401",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "F402",
    "name": "Mr. Salian Kiran Krishna & Mrs. Salian Sujatha Kiran",
    "email": "f402@patelheritage.com",
    "phone": "9619087779",
    "flat": "F402",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "F403",
    "name": "Mrs. Rashmi Govindankutty Menon",
    "email": "f403@patelheritage.com",
    "phone": "9892501550",
    "flat": "F403",
    "role": "resident",
    "password": "123",
    "tenantName": "Saurav Gupta",
    "tenantPhone": "7045846563"
  },
  {
    "id": "F501",
    "name": "Mr. Pramod Kumar & Mrs. Sreeja P. Kumar",
    "email": "f501@patelheritage.com",
    "phone": "8830302695",
    "flat": "F501",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "F502",
    "name": "Mr. Karman Gela Ravat & Mrs. Rupiben Karman Ravat",
    "email": "f502@patelheritage.com",
    "phone": "9930590682",
    "flat": "F502",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "F503",
    "name": "Mr. Arijit Sengupta & Mrs. Abanti Sengupta",
    "email": "f503@patelheritage.com",
    "phone": "9820993739",
    "flat": "F503",
    "role": "resident",
    "password": "123",
    "tenantName": "Mr. Abhinandan Kumar",
    "tenantPhone": "9410390947 / 9022612344"
  },
  {
    "id": "F601",
    "name": "Mrs. Vidhi G. Punjabi & Mr. Girish N. Punjabi",
    "email": "f601@patelheritage.com",
    "phone": "7045346563",
    "flat": "F601",
    "role": "resident",
    "password": "123",
    "tenantName": "Mrs. Varshney Divya",
    "tenantPhone": "8971775163"
  },
  {
    "id": "F602",
    "name": "Mr. Sameer Sahebrao Labde",
    "email": "f602@patelheritage.com",
    "phone": "9867261710",
    "flat": "F602",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "F603",
    "name": "Mr. Aveek Senapati & Mrs. Sparshi Banarjee",
    "email": "f603@patelheritage.com",
    "phone": "8130369991",
    "flat": "F603",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "F701",
    "name": "Mr. Vijendra Singh & Mrs. Neelam Singh",
    "email": "f701@patelheritage.com",
    "phone": "9426614242",
    "flat": "F701",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "F702",
    "name": "Mr. Pradeep Kumar & Mrs. Mamta Kumar",
    "email": "f702@patelheritage.com",
    "phone": "9410390947",
    "flat": "F702",
    "role": "resident",
    "password": "123",
    "tenantName": "Mr. Animesh Gayen",
    "tenantPhone": "9967437740"
  },
  {
    "id": "F703",
    "name": "Mr. Rachit Madan Vohra & Mrs. Rashmi Rachit Vohra",
    "email": "f703@patelheritage.com",
    "phone": "8971775163",
    "flat": "F703",
    "role": "resident",
    "password": "123",
    "tenantName": "Ganapatrao L. Pawar",
    "tenantPhone": "9967145474 / 8108791874"
  },
  {
    "id": "F801",
    "name": "Mrs. Parma Harji Patel",
    "email": "f801@patelheritage.com",
    "phone": "9920131477",
    "flat": "F801",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "F802",
    "name": "Mr. Mrs. Suhasini Pradhan & Mr Amit Pradhan",
    "email": "f802@patelheritage.com",
    "phone": "9223532289",
    "flat": "F802",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "F803",
    "name": "Mrs Rajani Thiagaraja Ayyar",
    "email": "f803@patelheritage.com",
    "phone": "9967393005",
    "flat": "F803",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "F901",
    "name": "Mr. Satyakumar Vasamshetty & Mr. Suryanarayana Vasamshetty",
    "email": "f901@patelheritage.com",
    "phone": "9769713440",
    "flat": "F901",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "F902",
    "name": "Mrs. Swati Devendra Shinde & Devendra Subhash Shinde",
    "email": "f902@patelheritage.com",
    "phone": "9004063982",
    "flat": "F902",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "F903",
    "name": "Mr. Manish Gupta & Mr. Mahendra Kumar Gupta",
    "email": "f903@patelheritage.com",
    "phone": "9594006917",
    "flat": "F903",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "F1001",
    "name": "Mr. Deepak Ramchandra Kshirsagar & Mrs. Ujwala D. Kshirsagar",
    "email": "f1001@patelheritage.com",
    "phone": "9967437740",
    "flat": "F1001",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "F1002",
    "name": "Mr. Deepak Ramchandra Kshirsagar & Mrs. Ujwala D. Kshirsagar",
    "email": "f1002@patelheritage.com",
    "phone": "9967437740",
    "flat": "F1002",
    "role": "resident",
    "password": "123",
    "tenantName": "Pratik Kharpuriya",
    "tenantPhone": "7652088368"
  },
  {
    "id": "F1003",
    "name": "Mr. Hamvir Singh & Mrs. Sunita Singh",
    "email": "f1003@patelheritage.com",
    "phone": "9819459879",
    "flat": "F1003",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "F1101",
    "name": "Mrs. Prakrati & Mr. Ashok Kumar Srivastva",
    "email": "f1101@patelheritage.com",
    "phone": "8108791874",
    "flat": "F1101",
    "role": "resident",
    "password": "123",
    "tenantName": "Naresh Kumar",
    "tenantPhone": "9769412577"
  },
  {
    "id": "F1102",
    "name": "Mr. Janardan V. Pimpale & Mrs. Kantabai J. Pimpale",
    "email": "f1102@patelheritage.com",
    "phone": "9029011504",
    "flat": "F1102",
    "role": "resident",
    "password": "123",
    "tenantName": "Suraj Uniyal",
    "tenantPhone": "9820196030"
  },
  {
    "id": "F1103",
    "name": "Mrs. Rup Priya Verma",
    "email": "f1103@patelheritage.com",
    "phone": "9769412577",
    "flat": "F1103",
    "role": "resident",
    "password": "123",
    "tenantName": "Mr. Shriyan Namrata",
    "tenantPhone": "9869054250"
  },
  {
    "id": "F1201",
    "name": "Mr. Shivaji Bhimaji Chaudhary & Mrs. Suchita Shivaji Chaudhary",
    "email": "f1201@patelheritage.com",
    "phone": "9820196030",
    "flat": "F1201",
    "role": "resident",
    "password": "123",
    "tenantName": "Shilpa Niraj Varma",
    "tenantPhone": "9820418244"
  },
  {
    "id": "F1202",
    "name": "Mr. Ayan Gupta & Mr. Bibhu Ranjan Gupta",
    "email": "f1202@patelheritage.com",
    "phone": "9769580274",
    "flat": "F1202",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "F1203",
    "name": "Mr. Ravindra Pal Singh & Mrs. Rekha Singh",
    "email": "f1203@patelheritage.com",
    "phone": "9869054250",
    "flat": "F1203",
    "role": "resident",
    "password": "123",
    "tenantName": "Mrs. Minal V. Tulsian",
    "tenantPhone": "9969224368"
  },
  {
    "id": "F1301",
    "name": "Mr. Amalendu C. Purandare & Mrs. Sarika A. Purandare",
    "email": "f1301@patelheritage.com",
    "phone": "9820418244",
    "flat": "F1301",
    "role": "resident",
    "password": "123",
    "tenantName": "Ashish Debath",
    "tenantPhone": "9820757840"
  },
  {
    "id": "F1303",
    "name": "Mr. N. Talisunup Jamir & Mrs. Anne Thomas Vushim",
    "email": "f1303@patelheritage.com",
    "phone": "9969220179",
    "flat": "F1303",
    "role": "resident",
    "password": "123",
    "tenantName": "Ranjit Gogoi",
    "tenantPhone": "9820233087"
  },
  {
    "id": "F1401",
    "name": "Mr. Shrikant Wasudeo Narkhede",
    "email": "f1401@patelheritage.com",
    "phone": "9820757840",
    "flat": "F1401",
    "role": "resident",
    "password": "123",
    "tenantName": "Mr. Amit Hemraj Bhanushali",
    "tenantPhone": "9999649900"
  },
  {
    "id": "F1402",
    "name": "Mr. Ramesh V Choudhary",
    "email": "f1402@patelheritage.com",
    "phone": "9833330330",
    "flat": "F1402",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "F1403",
    "name": "Mr. Akhilesh & Mrs. Dolly Khare",
    "email": "f1403@patelheritage.com",
    "phone": "9869222904",
    "flat": "F1403",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "F1501",
    "name": "Mrs Subramanyan Anuradha",
    "email": "f1501@patelheritage.com",
    "phone": "9967570472",
    "flat": "F1501",
    "role": "resident",
    "password": "123",
    "tenantName": "Mr. Panigrahy Saroj Kumar",
    "tenantPhone": "9819878143"
  },
  {
    "id": "F1502",
    "name": "Mr. Nilesh R. Pawar & Mrs. Ashvini N. Pawar",
    "email": "f1502@patelheritage.com",
    "phone": "9967435806",
    "flat": "F1502",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "F1503",
    "name": "Mr. Rajveer Singh Tomar",
    "email": "f1503@patelheritage.com",
    "phone": "9833458495",
    "flat": "F1503",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "F1601",
    "name": "Mrs. Sharmistha Dutta",
    "email": "f1601@patelheritage.com",
    "phone": "9920520005",
    "flat": "F1601",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "F1602",
    "name": "Mr. Anil Kamath & Mrs. Smitha Kamath",
    "email": "f1602@patelheritage.com",
    "phone": "9322099299",
    "flat": "F1602",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "F1603",
    "name": "Mrs. Ritu Jain & Mr. Sunil Kumar Ratanlal Jain",
    "email": "f1603@patelheritage.com",
    "phone": "9999649900",
    "flat": "F1603",
    "role": "resident",
    "password": "123",
    "tenantName": "Mr. Aveg Srivastava",
    "tenantPhone": ""
  },
  {
    "id": "F1701",
    "name": "Mrs. Prabha Rani Singh",
    "email": "f1701@patelheritage.com",
    "phone": "9113304574",
    "flat": "F1701",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "F1702",
    "name": "Mr. Suresh Kumar",
    "email": "f1702@patelheritage.com",
    "phone": "9869266183",
    "flat": "F1702",
    "role": "resident",
    "password": "123"
  },
  {
    "id": "F1703",
    "name": "Mr. Vikas Trivedi",
    "email": "f1703@patelheritage.com",
    "phone": "9819878143",
    "flat": "F1703",
    "role": "resident",
    "password": "123",
    "tenantName": "Mrs. Aparna Dinak",
    "tenantPhone": ""
  }
];

// Store passwords in localStorage for demo (in production, use backend)
export function getUsers(): UserWithPassword[] {
  if (typeof window === 'undefined') return MOCK_USERS;

  const stored = localStorage.getItem('patelHeritageUsers');
  if (stored) {
    try {
      const storedUsers = JSON.parse(stored) as UserWithPassword[];

      // Sync stored users with latest data from MOCK_USERS
      let hasUpdates = false;
      const updatedUsers = (storedUsers as UserWithPassword[])
        .filter(u => {
          const isMock = MOCK_USERS.some(m => m.id === u.id);
          const isSpecial = ['chairman', 'secretary', 'security', 'cook'].includes(u.role);
          if (!isMock && !isSpecial) {
            hasUpdates = true;
            return false;
          }
          return true;
        })
        .map(storedUser => {
          const mockUser = MOCK_USERS.find(u => u.id === storedUser.id);
          if (mockUser) {
            const needsUpdate =
              storedUser.name !== mockUser.name ||
              storedUser.phone !== mockUser.phone ||
              storedUser.flat !== mockUser.flat ||
              storedUser.role !== mockUser.role ||
              storedUser.email !== mockUser.email ||
              storedUser.tenantName !== mockUser.tenantName ||
              storedUser.tenantPhone !== mockUser.tenantPhone;

            if (needsUpdate) {
              hasUpdates = true;
              return {
                ...storedUser,
                name: mockUser.name,
                phone: mockUser.phone,
                flat: mockUser.flat,
                role: mockUser.role,
                email: mockUser.email,
                tenantName: mockUser.tenantName,
                tenantPhone: mockUser.tenantPhone
              };
            }
          }
          return storedUser;
        });

      // Add missing users from MOCK_USERS
      MOCK_USERS.forEach(mockUser => {
        if (!updatedUsers.find(u => u.id === mockUser.id)) {
          updatedUsers.push(mockUser);
          hasUpdates = true;
        }
      });

      if (hasUpdates) {
        saveUsers(updatedUsers);
      }

      return updatedUsers;
    } catch {
      return MOCK_USERS;
    }
  }
  // Initialize with default users
  localStorage.setItem('patelHeritageUsers', JSON.stringify(MOCK_USERS));
  return MOCK_USERS;
}

export function saveUsers(users: UserWithPassword[]) {
  localStorage.setItem('patelHeritageUsers', JSON.stringify(users));
}

export interface LoginCredentials {
  username: string; // Can be email or flat number
  password: string;
}

// Authentication function
export function login(credentials: LoginCredentials): User | null {
  const users = getUsers();
  const username = credentials.username.toUpperCase().trim();

  // Try to find user by flat number or email
  const user = users.find(u =>
    u.flat.toUpperCase() === username ||
    u.email.toLowerCase() === credentials.username.toLowerCase()
  );

  if (user && user.password === credentials.password) {
    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  return null;
}

export function getUserByFlat(flat: string): UserWithPassword | null {
  const users = getUsers();
  return users.find(u => u.flat.toUpperCase() === flat.toUpperCase()) || null;
}

export function getUserById(id: string): UserWithPassword | null {
  const users = getUsers();
  return users.find(u => u.id === id) || null;
}

// Only Chairman and Secretary are admins
export function isAdmin(user: User | null): boolean {
  return user?.role === 'chairman' || user?.role === 'secretary';
}

export function isCommitteeMember(user: User | null): boolean {
  if (!user) return false;
  return ['chairman', 'secretary'].includes(user.role);
}

export function canManageMessages(user: User | null): boolean {
  if (!user) return false;
  // Only admins can manage messages, security cannot access
  return isAdmin(user) && user.role !== 'security';
}

// Visitors are private - only security can manage, residents can pre-approve
export function canManageVisitors(user: User | null): boolean {
  if (!user) return false;
  return user.role === 'security';
}

export function canCreateAnnouncements(user: User | null): boolean {
  return isAdmin(user);
}

export function canManageShops(user: User | null): boolean {
  return isAdmin(user);
}

export function canViewAnalytics(user: User | null): boolean {
  return isAdmin(user);
}

export function canChangePasswords(user: User | null): boolean {
  return isAdmin(user);
}

export function canViewTiffinOrders(user: User | null): boolean {
  if (!user) return false;
  // Security cannot view tiffin orders
  if (user.role === 'security') return false;
  return user.role === 'cook' || isAdmin(user);
}

export function canViewCommonMessages(user: User | null): boolean {
  if (!user) return false;
  // Cook and Security cannot see common messages
  return user.role !== 'cook' && user.role !== 'security';
}

export function changePassword(flatOrId: string, newPassword: string, changedBy: User): boolean {
  if (!canChangePasswords(changedBy)) {
    return false;
  }

  const users = getUsers();
  const userIndex = users.findIndex(u =>
    u.flat.toUpperCase() === flatOrId.toUpperCase() || u.id === flatOrId
  );

  if (userIndex === -1) return false;

  users[userIndex].password = newPassword;
  saveUsers(users);
  return true;
}

// Generate all possible flat numbers for residents
export function generateResidentFlats(): string[] {
  const flats: string[] = [];
  const wings = ['A', 'B', 'C', 'D', 'E', 'F'];

  wings.forEach(wing => {
    const wingConfig = WING_CONFIGS.find((w: WingConfig) => w.wing === wing);
    if (!wingConfig) return;

    for (let floor = 2; floor <= wingConfig.floors; floor++) {
      const maxRooms = (['B', 'C', 'D', 'E'].includes(wing) && floor === 19) ? 1 : wingConfig.roomsPerFloor;
      for (let room = 1; room <= maxRooms; room++) {
        const flatNumber = `${floor}${String(room).padStart(2, '0')}`;
        flats.push(`${wing}${flatNumber}`);
      }
    }
  });

  return flats;
}
