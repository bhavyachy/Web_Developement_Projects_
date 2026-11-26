'use strict';

/* ==========================================================================
   RailConnect — National Railway Passenger Reservation System
   Core Data, Inventory Engine, Coach Layout, Booking & PRS Refund Logic
   ========================================================================== */

(function () {
  /* ------------------------------------------------------------------------
     1. MASTER STATION & TRAIN TIMETABLE DATA
     ------------------------------------------------------------------------ */
  const STATIONS = [
    { code: 'NDLS', name: 'New Delhi', city: 'Delhi', zone: 'NR', platforms: 16 },
    { code: 'BCT', name: 'Mumbai Central', city: 'Mumbai', zone: 'WR', platforms: 9 },
    { code: 'CSMT', name: 'C Shivaji Maharaj T', city: 'Mumbai', zone: 'CR', platforms: 18 },
    { code: 'HWH', name: 'Howrah Jn', city: 'Kolkata', zone: 'ER', platforms: 23 },
    { code: 'SBC', name: 'KSR Bengaluru', city: 'Bengaluru', zone: 'SWR', platforms: 10 },
    { code: 'MAS', name: 'MGR Chennai Central', city: 'Chennai', zone: 'SR', platforms: 12 },
    { code: 'VNS', name: 'Varanasi Jn', city: 'Varanasi', zone: 'NR', platforms: 9 },
    { code: 'PUNE', name: 'Pune Jn', city: 'Pune', zone: 'CR', platforms: 6 },
    { code: 'HYB', name: 'Hyderabad Deccan', city: 'Hyderabad', zone: 'SCR', platforms: 6 },
    { code: 'JP', name: 'Jaipur Jn', city: 'Jaipur', zone: 'NWR', platforms: 7 },
    { code: 'ADI', name: 'Ahmedabad Jn', city: 'Ahmedabad', zone: 'WR', platforms: 12 },
    { code: 'AGC', name: 'Agra Cantt', city: 'Agra', zone: 'NCR', platforms: 6 },
    { code: 'BPL', name: 'Rani Kamalapati / Bhopal', city: 'Bhopal', zone: 'WCR', platforms: 6 },
    { code: 'CNB', name: 'Kanpur Central', city: 'Kanpur', zone: 'NCR', platforms: 10 },
    { code: 'BRC', name: 'Vadodara Jn', city: 'Vadodara', zone: 'WR', platforms: 7 },
    { code: 'KOTA', name: 'Kota Jn', city: 'Kota', zone: 'WCR', platforms: 4 },
    { code: 'PRYJ', name: 'Prayagraj Jn', city: 'Prayagraj', zone: 'NCR', platforms: 10 },
    { code: 'DDU', name: 'Pt DD Upadhyaya Jn', city: 'Mughalsarai', zone: 'ECR', platforms: 8 },
    { code: 'BZA', name: 'Vijayawada Jn', city: 'Vijayawada', zone: 'SCR', platforms: 10 },
    { code: 'NGP', name: 'Nagpur Jn', city: 'Nagpur', zone: 'CR', platforms: 8 },
    { code: 'ST', name: 'Surat', city: 'Surat', zone: 'WR', platforms: 4 }
  ];

  const STATION_MAP = Object.fromEntries(STATIONS.map((s) => [s.code, s]));

  const CLASS_META = {
    '1A': {
      name: 'AC First Class',
      ratePerKm: 3.45,
      resFee: 60,
      sfFee: 75,
      catering: true,
      prefix: 'H',
      coaches: ['H1'],
      seatsPerCoach: 24,
      layout: 'first_ac',
      berthsPerBay: 4,
      labels: ['LB', 'UB', 'LB', 'UB']
    },
    '2A': {
      name: 'AC 2 Tier',
      ratePerKm: 2.05,
      resFee: 50,
      sfFee: 45,
      catering: true,
      prefix: 'A',
      coaches: ['A1', 'A2'],
      seatsPerCoach: 48,
      layout: 'two_tier',
      berthsPerBay: 6,
      labels: ['LB', 'UB', 'LB', 'UB', 'SL', 'SU']
    },
    '3A': {
      name: 'AC 3 Tier',
      ratePerKm: 1.42,
      resFee: 40,
      sfFee: 45,
      catering: false,
      prefix: 'B',
      coaches: ['B1', 'B2', 'B3'],
      seatsPerCoach: 64,
      layout: 'three_tier',
      berthsPerBay: 8,
      labels: ['LB', 'MB', 'UB', 'LB', 'MB', 'UB', 'SL', 'SU']
    },
    '3E': {
      name: 'AC 3 Economy',
      ratePerKm: 1.25,
      resFee: 40,
      sfFee: 45,
      catering: false,
      prefix: 'M',
      coaches: ['M1', 'M2'],
      seatsPerCoach: 64,
      layout: 'three_tier',
      berthsPerBay: 8,
      labels: ['LB', 'MB', 'UB', 'LB', 'MB', 'UB', 'SL', 'SU']
    },
    'EC': {
      name: 'Executive Chair Car',
      ratePerKm: 2.85,
      resFee: 60,
      sfFee: 75,
      catering: true,
      prefix: 'E',
      coaches: ['E1'],
      seatsPerCoach: 40,
      layout: 'exec_chair',
      berthsPerBay: 4,
      labels: ['WS', 'AS', 'AS', 'WS']
    },
    'CC': {
      name: 'AC Chair Car',
      ratePerKm: 1.55,
      resFee: 40,
      sfFee: 45,
      catering: true,
      prefix: 'C',
      coaches: ['C1', 'C2', 'C3'],
      seatsPerCoach: 50,
      layout: 'chair_car',
      berthsPerBay: 5,
      labels: ['WS', 'MS', 'AS', 'AS', 'WS']
    },
    'SL': {
      name: 'Sleeper Class',
      ratePerKm: 0.54,
      resFee: 20,
      sfFee: 30,
      catering: false,
      prefix: 'S',
      coaches: ['S1', 'S2', 'S3', 'S4'],
      seatsPerCoach: 64,
      layout: 'three_tier',
      berthsPerBay: 8,
      labels: ['LB', 'MB', 'UB', 'LB', 'MB', 'UB', 'SL', 'SU']
    }
  };

  const QUOTA_META = {
    GN: {
      label: 'General (GN)',
      multiplier: 1.0,
      note: 'General Quota: Standard base fare with 120-day advance reservation period.'
    },
    TQ: {
      label: 'Tatkal (TQ)',
      multiplier: 1.3,
      note: 'Tatkal Quota: +30% dynamic surcharge on basic fare. No concessions; non-refundable on confirmed cancellation.'
    },
    LD: {
      label: 'Ladies (LD)',
      multiplier: 1.0,
      note: 'Ladies Quota: Earmarked berths for solo female passengers or families with children under 12.'
    },
    SS: {
      label: 'Senior Citizen (SS)',
      multiplier: 1.0,
      note: 'Lower Berth Quota: Priority lower-berth allotment for male passengers 60+ and female passengers 45+.'
    }
  };

  // Running days array: [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
  const TRAINS = [
    {
      number: '12952',
      name: 'Mumbai Tejas Rajdhani',
      category: 'Rajdhani',
      runsOn: [1, 1, 1, 1, 1, 1, 1],
      classes: ['1A', '2A', '3A'],
      hasCatering: true,
      pantry: true,
      stops: [
        { code: 'NDLS', arr: '--', dep: '16:55', halt: 0, dist: 0, day: 1, pf: 3 },
        { code: 'KOTA', arr: '21:35', dep: '21:45', halt: 10, dist: 465, day: 1, pf: 1 },
        { code: 'BRC', arr: '03:40', dep: '03:50', halt: 10, dist: 993, day: 2, pf: 2 },
        { code: 'ST', arr: '05:13', dep: '05:18', halt: 5, dist: 1123, day: 2, pf: 1 },
        { code: 'BCT', arr: '08:35', dep: '--', halt: 0, dist: 1386, day: 2, pf: 4 }
      ]
    },
    {
      number: '12951',
      name: 'New Delhi Tejas Rajdhani',
      category: 'Rajdhani',
      runsOn: [1, 1, 1, 1, 1, 1, 1],
      classes: ['1A', '2A', '3A'],
      hasCatering: true,
      pantry: true,
      stops: [
        { code: 'BCT', arr: '--', dep: '17:00', halt: 0, dist: 0, day: 1, pf: 5 },
        { code: 'ST', arr: '19:43', dep: '19:48', halt: 5, dist: 263, day: 1, pf: 2 },
        { code: 'BRC', arr: '21:08', dep: '21:18', halt: 10, dist: 393, day: 1, pf: 1 },
        { code: 'KOTA', arr: '03:15', dep: '03:25', halt: 10, dist: 921, day: 2, pf: 2 },
        { code: 'NDLS', arr: '08:32', dep: '--', halt: 0, dist: 1386, day: 2, pf: 3 }
      ]
    },
    {
      number: '12954',
      name: 'August Kranti Rajdhani',
      category: 'Rajdhani',
      runsOn: [1, 1, 1, 1, 1, 1, 1],
      classes: ['1A', '2A', '3A'],
      hasCatering: true,
      pantry: true,
      stops: [
        { code: 'NDLS', arr: '--', dep: '17:15', halt: 0, dist: 0, day: 1, pf: 4 },
        { code: 'KOTA', arr: '22:10', dep: '22:20', halt: 10, dist: 458, day: 1, pf: 2 },
        { code: 'BRC', arr: '04:32', dep: '04:42', halt: 10, dist: 986, day: 2, pf: 3 },
        { code: 'ST', arr: '06:08', dep: '06:13', halt: 5, dist: 1116, day: 2, pf: 2 },
        { code: 'BCT', arr: '10:05', dep: '--', halt: 0, dist: 1379, day: 2, pf: 2 }
      ]
    },
    {
      number: '12904',
      name: 'Golden Temple Mail',
      category: 'Superfast',
      runsOn: [1, 1, 1, 1, 1, 1, 1],
      classes: ['1A', '2A', '3A', '3E', 'SL'],
      hasCatering: false,
      pantry: true,
      stops: [
        { code: 'NDLS', arr: '--', dep: '04:00', halt: 0, dist: 0, day: 1, pf: 7 },
        { code: 'KOTA', arr: '10:10', dep: '10:20', halt: 10, dist: 458, day: 1, pf: 3 },
        { code: 'BRC', arr: '18:02', dep: '18:12', halt: 10, dist: 986, day: 1, pf: 4 },
        { code: 'ST', arr: '19:48', dep: '19:53', halt: 5, dist: 1116, day: 1, pf: 1 },
        { code: 'BCT', arr: '23:35', dep: '--', halt: 0, dist: 1379, day: 1, pf: 6 }
      ]
    },
    {
      number: '22436',
      name: 'Varanasi Vande Bharat',
      category: 'Vande Bharat',
      runsOn: [1, 1, 1, 1, 0, 1, 1],
      classes: ['EC', 'CC'],
      hasCatering: true,
      pantry: true,
      stops: [
        { code: 'NDLS', arr: '--', dep: '06:00', halt: 0, dist: 0, day: 1, pf: 16 },
        { code: 'CNB', arr: '10:08', dep: '10:10', halt: 2, dist: 440, day: 1, pf: 1 },
        { code: 'PRYJ', arr: '12:08', dep: '12:10', halt: 2, dist: 634, day: 1, pf: 6 },
        { code: 'VNS', arr: '14:00', dep: '--', halt: 0, dist: 759, day: 1, pf: 1 }
      ]
    },
    {
      number: '22416',
      name: 'New Delhi - Varanasi Vande Bharat',
      category: 'Vande Bharat',
      runsOn: [1, 1, 0, 1, 1, 1, 1],
      classes: ['EC', 'CC'],
      hasCatering: true,
      pantry: true,
      stops: [
        { code: 'NDLS', arr: '--', dep: '15:00', halt: 0, dist: 0, day: 1, pf: 16 },
        { code: 'CNB', arr: '19:08', dep: '19:10', halt: 2, dist: 440, day: 1, pf: 2 },
        { code: 'PRYJ', arr: '21:11', dep: '21:13', halt: 2, dist: 634, day: 1, pf: 4 },
        { code: 'VNS', arr: '23:05', dep: '--', halt: 0, dist: 759, day: 1, pf: 4 }
      ]
    },
    {
      number: '12560',
      name: 'Shiv Ganga Superfast Express',
      category: 'Superfast',
      runsOn: [1, 1, 1, 1, 1, 1, 1],
      classes: ['1A', '2A', '3A', '3E', 'SL'],
      hasCatering: false,
      pantry: false,
      stops: [
        { code: 'NDLS', arr: '--', dep: '20:05', halt: 0, dist: 0, day: 1, pf: 12 },
        { code: 'CNB', arr: '01:00', dep: '01:05', halt: 5, dist: 440, day: 2, pf: 5 },
        { code: 'PRYJ', arr: '03:50', dep: '03:55', halt: 5, dist: 634, day: 2, pf: 3 },
        { code: 'VNS', arr: '06:25', dep: '--', halt: 0, dist: 759, day: 2, pf: 2 }
      ]
    },
    {
      number: '12302',
      name: 'Howrah Rajdhani Express',
      category: 'Rajdhani',
      runsOn: [1, 1, 1, 1, 1, 1, 1],
      classes: ['1A', '2A', '3A'],
      hasCatering: true,
      pantry: true,
      stops: [
        { code: 'NDLS', arr: '--', dep: '16:50', halt: 0, dist: 0, day: 1, pf: 9 },
        { code: 'CNB', arr: '21:32', dep: '21:37', halt: 5, dist: 440, day: 1, pf: 4 },
        { code: 'PRYJ', arr: '23:36', dep: '23:38', halt: 2, dist: 634, day: 1, pf: 2 },
        { code: 'DDU', arr: '01:38', dep: '01:48', halt: 10, dist: 786, day: 2, pf: 1 },
        { code: 'HWH', arr: '09:55', dep: '--', halt: 0, dist: 1451, day: 2, pf: 9 }
      ]
    },
    {
      number: '12301',
      name: 'New Delhi Rajdhani Express',
      category: 'Rajdhani',
      runsOn: [1, 1, 1, 1, 1, 1, 1],
      classes: ['1A', '2A', '3A'],
      hasCatering: true,
      pantry: true,
      stops: [
        { code: 'HWH', arr: '--', dep: '16:50', halt: 0, dist: 0, day: 1, pf: 9 },
        { code: 'DDU', arr: '00:55', dep: '01:05', halt: 10, dist: 665, day: 2, pf: 3 },
        { code: 'PRYJ', arr: '02:48', dep: '02:50', halt: 2, dist: 817, day: 2, pf: 1 },
        { code: 'CNB', arr: '04:50', dep: '04:55', halt: 5, dist: 1011, day: 2, pf: 2 },
        { code: 'NDLS', arr: '10:05', dep: '--', halt: 0, dist: 1451, day: 2, pf: 8 }
      ]
    },
    {
      number: '12007',
      name: 'Chennai - Mysuru Shatabdi',
      category: 'Shatabdi',
      runsOn: [1, 1, 1, 0, 1, 1, 1],
      classes: ['EC', 'CC'],
      hasCatering: true,
      pantry: true,
      stops: [
        { code: 'MAS', arr: '--', dep: '06:00', halt: 0, dist: 0, day: 1, pf: 5 },
        { code: 'SBC', arr: '10:50', dep: '--', halt: 0, dist: 362, day: 1, pf: 1 }
      ]
    },
    {
      number: '20608',
      name: 'Bengaluru - Chennai Vande Bharat',
      category: 'Vande Bharat',
      runsOn: [1, 1, 1, 1, 1, 1, 1],
      classes: ['EC', 'CC'],
      hasCatering: true,
      pantry: true,
      stops: [
        { code: 'SBC', arr: '--', dep: '17:00', halt: 0, dist: 0, day: 1, pf: 7 },
        { code: 'MAS', arr: '21:25', dep: '--', halt: 0, dist: 362, day: 1, pf: 3 }
      ]
    },
    {
      number: '12609',
      name: 'Bengaluru Intercity SF',
      category: 'Superfast',
      runsOn: [1, 1, 1, 1, 1, 1, 1],
      classes: ['2A', '3A', 'CC', 'SL'],
      hasCatering: false,
      pantry: true,
      stops: [
        { code: 'SBC', arr: '--', dep: '08:05', halt: 0, dist: 0, day: 1, pf: 4 },
        { code: 'MAS', arr: '14:20', dep: '--', halt: 0, dist: 362, day: 1, pf: 6 }
      ]
    },
    {
      number: '12124',
      name: 'Deccan Queen SF Express',
      category: 'Shatabdi',
      runsOn: [1, 1, 1, 1, 1, 1, 1],
      classes: ['EC', 'CC'],
      hasCatering: false,
      pantry: true,
      stops: [
        { code: 'PUNE', arr: '--', dep: '07:15', halt: 0, dist: 0, day: 1, pf: 1 },
        { code: 'BCT', arr: '10:25', dep: '--', halt: 0, dist: 192, day: 1, pf: 2 }
      ]
    },
    {
      number: '12123',
      name: 'Deccan Queen SF Express',
      category: 'Shatabdi',
      runsOn: [1, 1, 1, 1, 1, 1, 1],
      classes: ['EC', 'CC'],
      hasCatering: false,
      pantry: true,
      stops: [
        { code: 'BCT', arr: '--', dep: '17:10', halt: 0, dist: 0, day: 1, pf: 3 },
        { code: 'PUNE', arr: '20:25', dep: '--', halt: 0, dist: 192, day: 1, pf: 1 }
      ]
    },
    {
      number: '12260',
      name: 'Bikaner - Sealdah Duronto',
      category: 'Duronto',
      runsOn: [1, 1, 1, 1, 1, 1, 1],
      classes: ['1A', '2A', '3A', '3E', 'SL'],
      hasCatering: true,
      pantry: true,
      stops: [
        { code: 'NDLS', arr: '--', dep: '19:45', halt: 0, dist: 0, day: 1, pf: 6 },
        { code: 'CNB', arr: '00:40', dep: '00:45', halt: 5, dist: 440, day: 2, pf: 3 },
        { code: 'DDU', arr: '04:30', dep: '04:38', halt: 8, dist: 786, day: 2, pf: 2 },
        { code: 'HWH', arr: '12:15', dep: '--', halt: 0, dist: 1451, day: 2, pf: 14 }
      ]
    },
    {
      number: '12628',
      name: 'Karnataka Express',
      category: 'Superfast',
      runsOn: [1, 1, 1, 1, 1, 1, 1],
      classes: ['1A', '2A', '3A', '3E', 'SL'],
      hasCatering: false,
      pantry: true,
      stops: [
        { code: 'NDLS', arr: '--', dep: '20:20', halt: 0, dist: 0, day: 1, pf: 2 },
        { code: 'AGC', arr: '22:45', dep: '22:50', halt: 5, dist: 195, day: 1, pf: 2 },
        { code: 'BPL', arr: '06:25', dep: '06:35', halt: 10, dist: 702, day: 2, pf: 1 },
        { code: 'NGP', arr: '12:25', dep: '12:30', halt: 5, dist: 1091, day: 2, pf: 1 },
        { code: 'PUNE', arr: '23:10', dep: '23:25', halt: 15, dist: 1790, day: 2, pf: 3 },
        { code: 'SBC', arr: '12:00', dep: '--', halt: 0, dist: 2410, day: 3, pf: 2 }
      ]
    },
    {
      number: '12002',
      name: 'Bhopal Shatabdi Express',
      category: 'Shatabdi',
      runsOn: [1, 1, 1, 1, 1, 1, 1],
      classes: ['EC', 'CC'],
      hasCatering: true,
      pantry: true,
      stops: [
        { code: 'NDLS', arr: '--', dep: '06:00', halt: 0, dist: 0, day: 1, pf: 1 },
        { code: 'AGC', arr: '07:50', dep: '07:55', halt: 5, dist: 195, day: 1, pf: 1 },
        { code: 'BPL', arr: '14:25', dep: '--', halt: 0, dist: 702, day: 1, pf: 1 }
      ]
    },
    {
      number: '12724',
      name: 'Telangana Express',
      category: 'Superfast',
      runsOn: [1, 1, 1, 1, 1, 1, 1],
      classes: ['1A', '2A', '3A', 'SL'],
      hasCatering: false,
      pantry: true,
      stops: [
        { code: 'NDLS', arr: '--', dep: '16:00', halt: 0, dist: 0, day: 1, pf: 5 },
        { code: 'AGC', arr: '18:25', dep: '18:27', halt: 2, dist: 195, day: 1, pf: 3 },
        { code: 'BPL', arr: '01:15', dep: '01:23', halt: 8, dist: 702, day: 2, pf: 2 },
        { code: 'NGP', arr: '07:05', dep: '07:10', halt: 5, dist: 1091, day: 2, pf: 2 },
        { code: 'HYB', arr: '17:10', dep: '--', halt: 0, dist: 1672, day: 2, pf: 1 }
      ]
    },
    {
      number: '12957',
      name: 'Swarna Jayanti Rajdhani',
      category: 'Rajdhani',
      runsOn: [1, 1, 1, 1, 1, 1, 1],
      classes: ['1A', '2A', '3A'],
      hasCatering: true,
      pantry: true,
      stops: [
        { code: 'ADI', arr: '--', dep: '17:45', halt: 0, dist: 0, day: 1, pf: 1 },
        { code: 'JP', arr: '02:40', dep: '02:50', halt: 10, dist: 622, day: 2, pf: 2 },
        { code: 'NDLS', arr: '07:30', dep: '--', halt: 0, dist: 934, day: 2, pf: 4 }
      ]
    },
    {
      number: '12958',
      name: 'Ahmedabad Swarna Rajdhani',
      category: 'Rajdhani',
      runsOn: [1, 1, 1, 1, 1, 1, 1],
      classes: ['1A', '2A', '3A'],
      hasCatering: true,
      pantry: true,
      stops: [
        { code: 'NDLS', arr: '--', dep: '19:55', halt: 0, dist: 0, day: 1, pf: 5 },
        { code: 'JP', arr: '00:25', dep: '00:35', halt: 10, dist: 312, day: 2, pf: 3 },
        { code: 'ADI', arr: '09:30', dep: '--', halt: 0, dist: 934, day: 2, pf: 1 }
      ]
    },
    {
      number: '12841',
      name: 'Coromandel Express',
      category: 'Superfast',
      runsOn: [1, 1, 1, 1, 1, 1, 1],
      classes: ['1A', '2A', '3A', '3E', 'SL'],
      hasCatering: false,
      pantry: true,
      stops: [
        { code: 'HWH', arr: '--', dep: '15:20', halt: 0, dist: 0, day: 1, pf: 21 },
        { code: 'BZA', arr: '09:40', dep: '09:50', halt: 10, dist: 1228, day: 2, pf: 6 },
        { code: 'MAS', arr: '16:50', dep: '--', halt: 0, dist: 1659, day: 2, pf: 4 }
      ]
    }
  ];

  const TRAIN_MAP = Object.fromEntries(TRAINS.map((t) => [t.number, t]));

  const STORAGE_KEY = 'railconnect_bookings_v1';

  /* ------------------------------------------------------------------------
     2. UTILITY & DATE / TIME HELPERS
     ------------------------------------------------------------------------ */
  function toLocalDateStr(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function addDays(baseDateStr, offset) {
    const [y, m, d] = baseDateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + offset);
    return toLocalDateStr(dt);
  }

  function formatDisplayDate(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  function getWeekdayIndex(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).getDay();
  }

  function parseMinutes(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  }

  function formatDuration(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
  }

  function formatINR(amount) {
    return '\u20B9' + Math.round(amount).toLocaleString('en-IN');
  }

  function formatINRExact(amount) {
    return '\u20B9' + Number(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Deterministic hash for seeded occupancy & QR pattern
  function hashString(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'success' ? 'is-success' : ''}`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3600);
  }

  /* ------------------------------------------------------------------------
     3. SEGMENT, AVAILABILITY & FARE ENGINE
     ------------------------------------------------------------------------ */
  function computeSegment(train, originCode, destCode) {
    const oIdx = train.stops.findIndex((s) => s.code === originCode);
    const dIdx = train.stops.findIndex((s) => s.code === destCode);
    if (oIdx === -1 || dIdx === -1 || oIdx >= dIdx) return null;

    const originStop = train.stops[oIdx];
    const destStop = train.stops[dIdx];
    const depTime = originStop.dep === '--' ? originStop.arr : originStop.dep;
    const arrTime = destStop.arr === '--' ? destStop.dep : destStop.arr;

    const dayDiff = destStop.day - originStop.day;
    const durationMins = dayDiff * 1440 + parseMinutes(arrTime) - parseMinutes(depTime);
    const distanceKm = destStop.dist - originStop.dist;
    const haltsCount = dIdx - oIdx - 1;

    return {
      originStop,
      destStop,
      depTime,
      arrTime,
      dayDiff,
      durationMins,
      distanceKm,
      haltsCount,
      stopsSlice: train.stops.slice(oIdx, dIdx + 1)
    };
  }

  function computeFareBreakdown(train, classCode, distanceKm, quota, paxCount, includeInsurance) {
    const meta = CLASS_META[classCode];
    const qMeta = QUOTA_META[quota] || QUOTA_META.GN;
    const effectiveDist = Math.max(distanceKm, 120);

    const basePerPax = Math.round(effectiveDist * meta.ratePerKm * qMeta.multiplier);
    const resFeePerPax = meta.resFee;
    const sfFeePerPax = train.category === 'Express' ? 0 : meta.sfFee;
    const cateringPerPax = train.hasCatering && meta.catering ? (classCode === '1A' || classCode === 'EC' ? 245 : 155) : 0;

    const subPerPax = basePerPax + resFeePerPax + sfFeePerPax + cateringPerPax;
    const isAC = classCode !== 'SL';
    const gstPerPax = isAC ? Math.round(subPerPax * 0.05) : 0;

    const totalBase = basePerPax * paxCount;
    const totalRes = resFeePerPax * paxCount;
    const totalSf = sfFeePerPax * paxCount;
    const totalCatering = cateringPerPax * paxCount;
    const totalGst = gstPerPax * paxCount;
    const convenienceFee = isAC ? 35.4 : 17.7;
    const insuranceFee = includeInsurance ? Number((0.45 * paxCount).toFixed(2)) : 0;

    const grandTotal = Number(
      (totalBase + totalRes + totalSf + totalCatering + totalGst + convenienceFee + insuranceFee).toFixed(2)
    );

    return {
      perPaxTotal: subPerPax + gstPerPax,
      totalBase,
      totalRes,
      totalSf,
      totalCatering,
      totalGst,
      convenienceFee,
      insuranceFee,
      grandTotal
    };
  }

  // Build coach seats & merge with user-booked seats persisted in state.bookings
  function getCoachSeatsState(trainNumber, dateStr, classCode, coachId, quota) {
    const meta = CLASS_META[classCode];
    const rng = mulberry32(hashString(`${trainNumber}|${dateStr}|${classCode}|${coachId}`));

    // Occupancy rate varies realistically by quota & train category
    let baseOccupiedProb = 0.58;
    if (quota === 'TQ') baseOccupiedProb = 0.76;
    if (classCode === 'SL') baseOccupiedProb = 0.72;
    if (classCode === '1A' || classCode === 'EC') baseOccupiedProb = 0.48;

    // Collect already-booked seats from stored reservations on same train/date/class/coach
    const userBookedNums = new Set();
    state.bookings.forEach((bk) => {
      if (
        bk.status !== 'CANCELLED' &&
        bk.trainNumber === trainNumber &&
        bk.date === dateStr &&
        bk.classCode === classCode
      ) {
        bk.passengers.forEach((p) => {
          if (p.status === 'CNF' && p.coach === coachId && p.seatNo) {
            userBookedNums.add(Number(p.seatNo));
          }
        });
      }
    });

    const seats = [];
    for (let n = 1; n <= meta.seatsPerCoach; n++) {
      const idxInBay = (n - 1) % meta.berthsPerBay;
      const berthType = meta.labels[idxInBay];
      const roll = rng();

      let status = 'AVAILABLE';
      if (userBookedNums.has(n)) {
        status = 'BOOKED';
      } else if (roll < baseOccupiedProb) {
        status = 'BOOKED';
      } else if (roll < baseOccupiedProb + 0.08 && quota === 'GN' && berthType === 'LB') {
        status = 'QUOTA_HOLD';
      }

      seats.push({
        number: n,
        coach: coachId,
        berthType,
        status
      });
    }
    return seats;
  }

  function getClassAvailabilitySummary(train, dateStr, classCode, quota) {
    const meta = CLASS_META[classCode];
    let availCount = 0;
    meta.coaches.forEach((cId) => {
      const seats = getCoachSeatsState(train.number, dateStr, classCode, cId, quota);
      availCount += seats.filter((s) => s.status === 'AVAILABLE').length;
    });

    if (availCount > 0) {
      return {
        code: 'CNF',
        label: `AVAILABLE-${availCount}`,
        availCount,
        cssClass: 'status-cnf'
      };
    }

    // Deterministic RAC or WL fallback when coach inventory is full
    const rng = mulberry32(hashString(`WL|${train.number}|${dateStr}|${classCode}|${quota}`));
    const num = Math.floor(rng() * 18) + 2;
    if (classCode !== '1A' && classCode !== 'EC' && classCode !== 'CC' && rng() > 0.45) {
      return {
        code: 'RAC',
        label: `RAC ${num}`,
        availCount: 0,
        cssClass: 'status-rac'
      };
    }
    return {
      code: 'WL',
      label: `WL ${num}`,
      availCount: 0,
      cssClass: 'status-wl'
    };
  }

  /* ------------------------------------------------------------------------
     4. APPLICATION STATE & SEEDED BOOKINGS
     ------------------------------------------------------------------------ */
  function createSeededBookings() {
    const today = toLocalDateStr(new Date());
    const plus2 = addDays(today, 2);
    const plus5 = addDays(today, 5);
    const plus1 = addDays(today, 1);

    return [
      {
        pnr: '4218793054',
        transactionId: 'TXN9041827510',
        bookedAt: `${today} 09:14 IST`,
        trainNumber: '12952',
        trainName: 'Mumbai Tejas Rajdhani',
        origin: 'NDLS',
        dest: 'BCT',
        boarding: 'NDLS',
        date: plus2,
        depTime: '16:55',
        arrTime: '08:35',
        dayDiff: 1,
        distanceKm: 1386,
        classCode: '2A',
        quota: 'GN',
        status: 'CONFIRMED',
        contactMobile: '9811402938',
        contactEmail: 'arjun.mehta@example.in',
        paymentMethod: 'UPI (arjun@okicici)',
        fare: {
          totalBase: 5684,
          totalRes: 100,
          totalSf: 90,
          totalCatering: 310,
          totalGst: 309,
          convenienceFee: 35.4,
          insuranceFee: 0.9,
          grandTotal: 6529.3
        },
        passengers: [
          {
            name: 'Arjun Mehta',
            age: 34,
            gender: 'M',
            berthPref: 'LB',
            meal: 'Veg',
            status: 'CNF',
            coach: 'A1',
            seatNo: 19,
            berthType: 'LB'
          },
          {
            name: 'Kavya Mehta',
            age: 31,
            gender: 'F',
            berthPref: 'UB',
            meal: 'Veg',
            status: 'CNF',
            coach: 'A1',
            seatNo: 20,
            berthType: 'UB'
          }
        ]
      },
      {
        pnr: '6582104931',
        transactionId: 'TXN7723910428',
        bookedAt: `${today} 08:42 IST`,
        trainNumber: '12628',
        trainName: 'Karnataka Express',
        origin: 'NDLS',
        dest: 'SBC',
        boarding: 'NDLS',
        date: plus5,
        depTime: '20:20',
        arrTime: '12:00',
        dayDiff: 2,
        distanceKm: 2410,
        classCode: '3A',
        quota: 'GN',
        status: 'PARTIAL_WL',
        contactMobile: '9900214567',
        contactEmail: 'rohan.kulkarni@example.in',
        paymentMethod: 'NetBanking (HDFC)',
        fare: {
          totalBase: 6844,
          totalRes: 80,
          totalSf: 90,
          totalCatering: 0,
          totalGst: 350,
          convenienceFee: 35.4,
          insuranceFee: 0.9,
          grandTotal: 7400.3
        },
        passengers: [
          {
            name: 'Rohan Kulkarni',
            age: 42,
            gender: 'M',
            berthPref: 'SL',
            meal: 'No Meal',
            status: 'RAC',
            coach: 'B2',
            seatNo: 'RAC 4',
            berthType: 'SL'
          },
          {
            name: 'Meera Kulkarni',
            age: 39,
            gender: 'F',
            berthPref: 'SU',
            meal: 'No Meal',
            status: 'WL',
            coach: '--',
            seatNo: 'WL 3',
            berthType: '--'
          }
        ]
      },
      {
        pnr: '8903412765',
        transactionId: 'TXN6618302914',
        bookedAt: `${today} 07:55 IST`,
        trainNumber: '22436',
        trainName: 'Varanasi Vande Bharat',
        origin: 'NDLS',
        dest: 'VNS',
        boarding: 'NDLS',
        date: plus1,
        depTime: '06:00',
        arrTime: '14:00',
        dayDiff: 0,
        distanceKm: 759,
        classCode: 'EC',
        quota: 'GN',
        status: 'CONFIRMED',
        contactMobile: '9820341122',
        contactEmail: 'dr.sharma@example.in',
        paymentMethod: 'Card (**** 9012)',
        fare: {
          totalBase: 2163,
          totalRes: 60,
          totalSf: 75,
          totalCatering: 245,
          totalGst: 127,
          convenienceFee: 35.4,
          insuranceFee: 0.45,
          grandTotal: 2705.85
        },
        passengers: [
          {
            name: 'Dr. Siddharth Sharma',
            age: 51,
            gender: 'M',
            berthPref: 'WS',
            meal: 'Veg',
            status: 'CNF',
            coach: 'E1',
            seatNo: 12,
            berthType: 'WS'
          }
        ]
      }
    ];
  }

  function loadBookings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_err) {
      // Ignore storage read error
    }
    const seeded = createSeededBookings();
    saveBookings(seeded);
    return seeded;
  }

  function saveBookings(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (_err) {
      // Ignore storage write error
    }
  }

  const todayStr = toLocalDateStr(new Date());
  const defaultDateStr = addDays(todayStr, 1);

  const state = {
    activeView: 'book',
    search: {
      origin: 'NDLS',
      dest: 'BCT',
      date: defaultDateStr,
      preferredClass: 'ALL',
      quota: 'GN'
    },
    bookings: loadBookings(),
    bookingsFilter: 'ALL',
    bookingFlow: {
      active: false,
      step: 1,
      train: null,
      segment: null,
      classCode: null,
      paxCount: 1,
      activeCoach: null,
      selectedSeats: [], // [{ coach, number, berthType }]
      passengers: [],
      paymentMethod: 'upi',
      confirmedTicket: null
    }
  };

  /* ------------------------------------------------------------------------
     5. LIVE CLOCK & NAVIGATION
     ------------------------------------------------------------------------ */
  function startClock() {
    const el = document.getElementById('live-clock');
    function tick() {
      const now = new Date();
      el.textContent = now.toLocaleTimeString('en-IN', { hour12: false }) + ' IST';
    }
    tick();
    setInterval(tick, 1000);
  }

  function switchView(viewName) {
    state.activeView = viewName;
    document.querySelectorAll('.nav-tab').forEach((btn) => {
      const isMatch = btn.dataset.view === viewName;
      btn.classList.toggle('is-active', isMatch);
      btn.setAttribute('aria-selected', String(isMatch));
    });
    document.querySelectorAll('.view-section').forEach((sec) => {
      sec.classList.toggle('is-active', sec.id === `view-${viewName}`);
    });

    if (viewName === 'bookings') renderBookingsView();
    if (viewName === 'schedule') renderScheduleView();
  }

  function updateBookingsBadge() {
    const activeCount = state.bookings.filter((b) => b.status !== 'CANCELLED').length;
    document.getElementById('bookings-count').textContent = String(activeCount);
  }

  /* ------------------------------------------------------------------------
     6. STATION AUTOCOMPLETE & SEARCH CONTROLS
     ------------------------------------------------------------------------ */
  function formatStationInputText(code) {
    const st = STATION_MAP[code];
    return st ? `${st.name} (${st.code})` : code;
  }

  function setupStationDropdown(inputId, dropdownId, badgeId, onSelect) {
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);
    const badge = document.getElementById(badgeId);

    function renderOptions(query) {
      const q = query.trim().toLowerCase();
      const matches = STATIONS.filter(
        (s) =>
          !q ||
          s.code.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q)
      );

      if (matches.length === 0) {
        dropdown.innerHTML = `<div class="station-option"><span class="muted-text">No matching station</span></div>`;
      } else {
        dropdown.innerHTML = matches
          .map(
            (s) => `
          <div class="station-option" role="option" data-code="${s.code}">
            <div>
              <div class="station-opt-name">${escapeHtml(s.name)}</div>
              <div class="station-opt-city">${escapeHtml(s.city)} &bull; ${s.zone} Zone</div>
            </div>
            <span class="code-pill mono" style="position:static;">${s.code}</span>
          </div>`
          )
          .join('');
      }
      dropdown.classList.add('is-open');
    }

    input.addEventListener('focus', () => {
      input.select();
      renderOptions('');
    });

    input.addEventListener('input', () => {
      const upper = input.value.trim().toUpperCase();
      if (STATION_MAP[upper]) {
        badge.textContent = upper;
        onSelect(upper);
      }
      renderOptions(input.value);
    });

    dropdown.addEventListener('mousedown', (e) => {
      const opt = e.target.closest('.station-option[data-code]');
      if (!opt) return;
      const code = opt.dataset.code;
      input.value = formatStationInputText(code);
      badge.textContent = code;
      dropdown.classList.remove('is-open');
      onSelect(code);
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest(`#${inputId}`) && !e.target.closest(`#${dropdownId}`)) {
        dropdown.classList.remove('is-open');
      }
    });
  }

  function syncSearchInputsFromState() {
    document.getElementById('origin-input').value = formatStationInputText(state.search.origin);
    document.getElementById('origin-code-badge').textContent = state.search.origin;
    document.getElementById('dest-input').value = formatStationInputText(state.search.dest);
    document.getElementById('dest-code-badge').textContent = state.search.dest;
    document.getElementById('journey-date').value = state.search.date;
    document.getElementById('search-class').value = state.search.preferredClass;
    document.getElementById('search-quota').value = state.search.quota;
    document.getElementById('quota-policy-note').textContent = QUOTA_META[state.search.quota].note;
  }

  /* ------------------------------------------------------------------------
     7. TRAIN SEARCH, FILTERING & RENDERING
     ------------------------------------------------------------------------ */
  function getDepWindow(hhmm) {
    const mins = parseMinutes(hhmm);
    if (mins < 720) return 'morning';
    if (mins < 1020) return 'afternoon';
    if (mins < 1260) return 'evening';
    return 'night';
  }

  function renderTrainResults() {
    const errorEl = document.getElementById('search-form-error');
    errorEl.textContent = '';

    if (state.search.origin === state.search.dest) {
      errorEl.textContent = 'Origin and destination stations cannot be the same.';
      return;
    }

    const activeTypes = new Set(
      Array.from(document.querySelectorAll('input[name="filter-type"]:checked')).map((el) => el.value)
    );
    const activeDepWindows = new Set(
      Array.from(document.querySelectorAll('input[name="filter-dep"]:checked')).map((el) => el.value)
    );
    const availOnly = document.getElementById('filter-available-only').checked;
    const sortBy = document.getElementById('sort-select').value;
    const dayIdx = getWeekdayIndex(state.search.date);

    let matched = [];
    TRAINS.forEach((train) => {
      const seg = computeSegment(train, state.search.origin, state.search.dest);
      if (!seg) return;
      if (!activeTypes.has(train.category)) return;
      if (!activeDepWindows.has(getDepWindow(seg.depTime))) return;

      const visibleClasses =
        state.search.preferredClass === 'ALL'
          ? train.classes
          : train.classes.filter((c) => c === state.search.preferredClass);

      if (visibleClasses.length === 0) return;

      const classData = visibleClasses.map((cls) => {
        const fare = computeFareBreakdown(train, cls, seg.distanceKm, state.search.quota, 1, false);
        const avail = getClassAvailabilitySummary(train, state.search.date, cls, state.search.quota);
        return { classCode: cls, fare: fare.perPaxTotal, avail };
      });

      if (availOnly && !classData.some((c) => c.avail.code === 'CNF')) return;

      const runsToday = Boolean(train.runsOn[dayIdx]);
      const minFare = Math.min(...classData.map((c) => c.fare));

      matched.push({ train, seg, classData, runsToday, minFare });
    });

    matched.sort((a, b) => {
      if (a.runsToday !== b.runsToday) return a.runsToday ? -1 : 1;
      if (sortBy === 'dep_asc') return parseMinutes(a.seg.depTime) - parseMinutes(b.seg.depTime);
      if (sortBy === 'dur_asc') return a.seg.durationMins - b.seg.durationMins;
      if (sortBy === 'arr_asc') return parseMinutes(a.seg.arrTime) - parseMinutes(b.seg.arrTime);
      if (sortBy === 'fare_asc') return a.minFare - b.minFare;
      return 0;
    });

    const originSt = STATION_MAP[state.search.origin];
    const destSt = STATION_MAP[state.search.dest];
    document.getElementById('results-summary').innerHTML = `
      <strong>${matched.length}</strong> train${matched.length === 1 ? '' : 's'} found for
      <strong>${escapeHtml(originSt.name)} (${originSt.code}) &rarr; ${escapeHtml(destSt.name)} (${destSt.code})</strong>
      on <span class="mono">${formatDisplayDate(state.search.date)}</span>
      &bull; Quota: <strong>${QUOTA_META[state.search.quota].label}</strong>
    `;

    const listEl = document.getElementById('train-results-list');
    if (matched.length === 0) {
      listEl.innerHTML = `
        <div class="card empty-state">
          <strong>No direct trains match your search or active filters.</strong>
          <p>Try resetting filters, selecting "All Classes", or choosing one of the quick trunk corridors above.</p>
        </div>`;
      return;
    }

    const dayLetters = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    listEl.innerHTML = matched
      .map(({ train, seg, classData, runsToday }) => {
        const daysHtml = train.runsOn
          .map(
            (on, idx) =>
              `<span class="day-pill ${on ? 'is-on' : 'is-off'}" title="${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][idx]}">${dayLetters[idx]}</span>`
          )
          .join('');

        const classesHtml = classData
          .map((c) => {
            const disabledAttr = runsToday ? '' : 'disabled title="Train does not operate on selected date"';
            return `
            <button type="button" class="class-tile ${c.avail.cssClass}" data-book-train="${train.number}" data-book-class="${c.classCode}" ${disabledAttr}>
              <div class="class-tile-head">
                <span class="class-code">${c.classCode}</span>
                <span class="class-fare">${formatINR(c.fare)}</span>
              </div>
              <div class="class-status">${c.avail.label}</div>
              <div class="class-subnote">${CLASS_META[c.classCode].name}</div>
            </button>`;
          })
          .join('');

        const dayOffsetText = seg.dayDiff > 0 ? `<span class="badge badge-neutral" style="margin-left:6px;">+${seg.dayDiff}d</span>` : '';
        const runsWarning = runsToday
          ? ''
          : `<span class="badge badge-wl">Does not run on ${formatDisplayDate(state.search.date).split(',')[0]}</span>`;

        return `
        <article class="card train-card">
          <div class="train-card-top">
            <div class="train-identity">
              <span class="train-num-badge">${train.number}</span>
              <span class="train-name">${escapeHtml(train.name)}</span>
              <span class="train-type-tag">${train.category}</span>
              ${runsWarning}
            </div>
            <div class="train-meta-right">
              <div class="runs-on" aria-label="Operating days">${daysHtml}</div>
              <button type="button" class="link-btn" data-view-route="${train.number}">View Schedule &amp; Halts</button>
            </div>
          </div>

          <div class="train-timetable-row">
            <div class="station-time-block">
              <div class="time-big">${seg.depTime}</div>
              <div class="station-line">${escapeHtml(STATION_MAP[seg.originStop.code].name)} (${seg.originStop.code})</div>
              <div class="platform-line">Expected Platform ${seg.originStop.pf}</div>
            </div>

            <div class="route-connector">
              <span class="duration-label">${formatDuration(seg.durationMins)}</span>
              <div class="track-line" aria-hidden="true"></div>
              <span class="distance-label">${seg.distanceKm} km &bull; ${seg.haltsCount} intermediate halt${seg.haltsCount === 1 ? '' : 's'}</span>
            </div>

            <div class="station-time-block is-right">
              <div class="time-big">${seg.arrTime}${dayOffsetText}</div>
              <div class="station-line">${escapeHtml(STATION_MAP[seg.destStop.code].name)} (${seg.destStop.code})</div>
              <div class="platform-line">Expected Platform ${seg.destStop.pf}</div>
            </div>
          </div>

          <div class="class-availability-strip">
            ${classesHtml}
          </div>
        </article>`;
      })
      .join('');
  }

  /* ------------------------------------------------------------------------
     8. MULTI-STEP BOOKING WORKSPACE
     ------------------------------------------------------------------------ */
  function startBookingFlow(trainNumber, classCode) {
    const train = TRAIN_MAP[trainNumber];
    const seg = computeSegment(train, state.search.origin, state.search.dest);
    if (!train || !seg) return;

    const meta = CLASS_META[classCode];
    const bf = state.bookingFlow;

    bf.active = true;
    bf.step = 1;
    bf.train = train;
    bf.segment = seg;
    bf.classCode = classCode;
    bf.paxCount = 1;
    bf.activeCoach = meta.coaches[0];
    bf.selectedSeats = [];
    bf.confirmedTicket = null;
    bf.passengers = [createEmptyPassenger(0)];

    document.getElementById('search-form').closest('.search-card').classList.add('is-hidden');
    document.getElementById('results-workspace').classList.add('is-hidden');
    document.getElementById('booking-flow-workspace').classList.remove('is-hidden');

    document.getElementById('booking-train-brief').innerHTML = `
      <div class="train-identity">
        <span class="train-num-badge">${train.number}</span>
        <strong style="font-size:15.5px;">${escapeHtml(train.name)}</strong>
        <span class="badge badge-neutral">${classCode} &bull; ${meta.name}</span>
        <span class="badge badge-neutral">${QUOTA_META[state.search.quota].label}</span>
      </div>
      <div class="muted-text" style="margin-top:4px;">
        <strong>${seg.originStop.code}</strong> (${seg.depTime}) &rarr; <strong>${seg.destStop.code}</strong> (${seg.arrTime})
        &bull; ${formatDisplayDate(state.search.date)} &bull; ${seg.distanceKm} km
      </div>`;

    document.getElementById('pax-count-select').value = '1';
    document.getElementById('fare-class-badge').textContent = classCode;
    document.getElementById('step-2-error').textContent = '';
    document.getElementById('step-3-error').textContent = '';

    // Populate boarding station options from origin up to one before dest
    const boardingSelect = document.getElementById('boarding-station');
    const validBoardingStops = seg.stopsSlice.slice(0, -1);
    boardingSelect.innerHTML = validBoardingStops
      .map((s) => `<option value="${s.code}">${STATION_MAP[s.code].name} (${s.code}) - Dep ${s.dep === '--' ? s.arr : s.dep}</option>`)
      .join('');

    setBookingStep(1);
    renderCoachTabs();
    renderCoachMap();
    updateFareSidebar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function exitBookingFlow() {
    state.bookingFlow.active = false;
    document.getElementById('booking-flow-workspace').classList.add('is-hidden');
    document.getElementById('search-form').closest('.search-card').classList.remove('is-hidden');
    document.getElementById('results-workspace').classList.remove('is-hidden');
    renderTrainResults();
  }

  function setBookingStep(stepNum) {
    state.bookingFlow.step = stepNum;
    document.querySelectorAll('.step-item').forEach((item) => {
      const n = Number(item.dataset.step);
      item.classList.toggle('is-active', n === stepNum);
      item.classList.toggle('is-done', n < stepNum);
    });

    for (let i = 1; i <= 4; i++) {
      document.getElementById(`step-panel-${i}`).classList.toggle('is-hidden', i !== stepNum);
    }

    document.getElementById('fare-sidebar').classList.toggle('is-hidden', stepNum === 4);
  }

  function renderCoachTabs() {
    const bf = state.bookingFlow;
    const meta = CLASS_META[bf.classCode];
    const container = document.getElementById('coach-tabs');

    container.innerHTML = meta.coaches
      .map((cId) => {
        const seats = getCoachSeatsState(bf.train.number, state.search.date, bf.classCode, cId, state.search.quota);
        const avail = seats.filter((s) => s.status === 'AVAILABLE').length;
        const isActive = cId === bf.activeCoach;
        return `
        <button type="button" class="coach-tab ${isActive ? 'is-active' : ''}" data-coach-id="${cId}">
          ${cId}
          <span>${avail} Avl</span>
        </button>`;
      })
      .join('');
  }

  function renderCoachMap() {
    const bf = state.bookingFlow;
    const meta = CLASS_META[bf.classCode];
    const seats = getCoachSeatsState(bf.train.number, state.search.date, bf.classCode, bf.activeCoach, state.search.quota);

    document.getElementById('active-coach-label').textContent = `COACH ${bf.activeCoach} (${meta.name.toUpperCase()})`;

    const grid = document.getElementById('coach-map-grid');
    const baySize = meta.berthsPerBay;
    const totalBays = Math.ceil(seats.length / baySize);
    const rowsHtml = [];

    for (let b = 0; b < totalBays; b++) {
      const slice = seats.slice(b * baySize, (b + 1) * baySize);
      const isChair = meta.layout === 'chair_car' || meta.layout === 'exec_chair';

      const makeBtn = (s) => {
        const isSel = bf.selectedSeats.some((sel) => sel.coach === s.coach && sel.number === s.number);
        let cls = 'berth-btn';
        let disabled = '';
        if (isSel) cls += ' is-selected';
        else if (s.status === 'BOOKED') {
          cls += ' is-booked';
          disabled = 'disabled';
        } else if (s.status === 'QUOTA_HOLD') {
          cls += ' is-quota-hold';
          disabled = 'disabled';
        }
        return `
          <button type="button" class="${cls}" data-seat-num="${s.number}" data-berth-type="${s.berthType}" ${disabled} title="Seat ${s.number} (${s.berthType}) - ${s.status}">
            <span class="berth-num">${s.number}</span>
            <span class="berth-type">${s.berthType}</span>
          </button>`;
      };

      if (isChair) {
        const leftCount = meta.layout === 'exec_chair' ? 2 : 3;
        const leftSeats = slice.slice(0, leftCount).map(makeBtn).join('');
        const rightSeats = slice.slice(leftCount).map(makeBtn).join('');
        rowsHtml.push(`
          <div class="bay-row is-chair-row">
            <div class="bay-label">R${b + 1}</div>
            <div class="bay-main-berths ${leftCount === 2 ? 'cols-2' : ''}">${leftSeats}</div>
            <div class="bay-aisle" aria-hidden="true"></div>
            <div class="bay-main-berths cols-2">${rightSeats}</div>
          </div>`);
      } else if (meta.layout === 'first_ac') {
        rowsHtml.push(`
          <div class="bay-row is-chair-row">
            <div class="bay-label">CAB ${b + 1}</div>
            <div class="bay-main-berths cols-2">${slice.slice(0, 2).map(makeBtn).join('')}</div>
            <div class="bay-aisle" aria-hidden="true"></div>
            <div class="bay-main-berths cols-2">${slice.slice(2, 4).map(makeBtn).join('')}</div>
          </div>`);
      } else {
        // Two-tier (6 per bay: 4 main + 2 side) or Three-tier (8 per bay: 6 main + 2 side)
        const mainCount = meta.layout === 'two_tier' ? 4 : 6;
        const mainSeats = slice.slice(0, mainCount).map(makeBtn).join('');
        const sideSeats = slice.slice(mainCount).map(makeBtn).join('');
        rowsHtml.push(`
          <div class="bay-row">
            <div class="bay-label">B${b + 1}</div>
            <div class="bay-main-berths ${mainCount === 4 ? 'cols-2' : ''}">${mainSeats}</div>
            <div class="bay-aisle" aria-hidden="true"></div>
            <div class="bay-side-berths">${sideSeats}</div>
          </div>`);
      }
    }

    grid.innerHTML = rowsHtml.join('');
    updateSelectedSeatsReadout();
  }

  function updateSelectedSeatsReadout() {
    const bf = state.bookingFlow;
    const el = document.getElementById('selected-seats-readout');
    if (bf.selectedSeats.length === 0) {
      el.innerHTML = `Selected: <strong>None</strong> (Auto-allocation or WL/RAC will apply if none selected)`;
    } else {
      const list = bf.selectedSeats.map((s) => `<span class="passenger-seat-tag">${s.coach}-${s.number} (${s.berthType})</span>`).join(' ');
      el.innerHTML = `Selected (${bf.selectedSeats.length}/${bf.paxCount}): ${list}`;
    }
  }

  function autoAssignSeats() {
    const bf = state.bookingFlow;
    const meta = CLASS_META[bf.classCode];
    const picked = [];

    for (const cId of meta.coaches) {
      const seats = getCoachSeatsState(bf.train.number, state.search.date, bf.classCode, cId, state.search.quota);
      for (const s of seats) {
        if (s.status === 'AVAILABLE') {
          picked.push({ coach: cId, number: s.number, berthType: s.berthType });
          if (picked.length >= bf.paxCount) break;
        }
      }
      if (picked.length >= bf.paxCount) break;
    }

    bf.selectedSeats = picked;
    if (picked.length > 0) {
      bf.activeCoach = picked[0].coach;
      renderCoachTabs();
      renderCoachMap();
      showToast(`Auto-assigned ${picked.length} berth(s) in Coach ${picked[0].coach}.`, 'success');
    } else {
      renderCoachMap();
      showToast('No confirmed berths open on this coach; booking will be processed under RAC/Waitlist.', 'info');
    }
  }

  function createEmptyPassenger(index) {
    const bf = state.bookingFlow;
    const isChair = bf.classCode === 'CC' || bf.classCode === 'EC';
    return {
      name: '',
      age: '',
      gender: 'M',
      berthPref: isChair ? 'WS' : 'LB',
      meal: bf.train && bf.train.hasCatering && CLASS_META[bf.classCode].catering ? 'Veg' : 'No Meal'
    };
  }

  function syncPassengersCount() {
    const bf = state.bookingFlow;
    while (bf.passengers.length < bf.paxCount) {
      bf.passengers.push(createEmptyPassenger(bf.passengers.length));
    }
    if (bf.passengers.length > bf.paxCount) {
      bf.passengers = bf.passengers.slice(0, bf.paxCount);
    }
    if (bf.selectedSeats.length > bf.paxCount) {
      bf.selectedSeats = bf.selectedSeats.slice(0, bf.paxCount);
    }
  }

  function renderPassengerFormRows() {
    const bf = state.bookingFlow;
    syncPassengersCount();
    const container = document.getElementById('passenger-rows-container');
    const isChair = bf.classCode === 'CC' || bf.classCode === 'EC';
    const hasMeals = bf.train.hasCatering && CLASS_META[bf.classCode].catering;

    const berthOptions = isChair
      ? `<option value="NP">No Preference</option><option value="WS">Window Seat (WS)</option><option value="AS">Aisle Seat (AS)</option>`
      : `<option value="NP">No Preference</option><option value="LB">Lower Berth (LB)</option><option value="MB">Middle Berth (MB)</option><option value="UB">Upper Berth (UB)</option><option value="SL">Side Lower (SL)</option><option value="SU">Side Upper (SU)</option>`;

    container.innerHTML = bf.passengers
      .map((pax, idx) => {
        const seat = bf.selectedSeats[idx];
        const seatTag = seat
          ? `<span class="passenger-seat-tag">Assigned: ${seat.coach}-${seat.number} (${seat.berthType})</span>`
          : `<span class="passenger-seat-tag">Auto / Chart Allocation</span>`;

        const removeBtn =
          bf.passengers.length > 1
            ? `<button type="button" class="link-btn" data-remove-pax="${idx}">Remove</button>`
            : '';

        return `
        <div class="passenger-card" data-pax-idx="${idx}">
          <div class="passenger-card-head">
            <div class="passenger-card-title">
              <span>Passenger ${idx + 1}</span>
              ${seatTag}
            </div>
            ${removeBtn}
          </div>
          <div class="form-grid-4">
            <div class="field-group">
              <label>Full Name *</label>
              <input type="text" class="pax-name" value="${escapeHtml(pax.name)}" placeholder="As on Govt Photo ID" required>
            </div>
            <div class="field-group">
              <label>Age *</label>
              <input type="number" class="pax-age" min="1" max="115" value="${escapeHtml(pax.age)}" placeholder="Age" required>
            </div>
            <div class="field-group">
              <label>Gender *</label>
              <select class="pax-gender">
                <option value="M" ${pax.gender === 'M' ? 'selected' : ''}>Male</option>
                <option value="F" ${pax.gender === 'F' ? 'selected' : ''}>Female</option>
                <option value="T" ${pax.gender === 'T' ? 'selected' : ''}>Transgender</option>
              </select>
            </div>
            <div class="field-group">
              <label>${hasMeals ? 'Meal Choice' : 'Berth Preference'}</label>
              ${
                hasMeals
                  ? `<select class="pax-meal">
                      <option value="Veg" ${pax.meal === 'Veg' ? 'selected' : ''}>Veg Meal</option>
                      <option value="Non-Veg" ${pax.meal === 'Non-Veg' ? 'selected' : ''}>Non-Veg Meal</option>
                      <option value="Jain" ${pax.meal === 'Jain' ? 'selected' : ''}>Jain Meal</option>
                      <option value="No Meal" ${pax.meal === 'No Meal' ? 'selected' : ''}>No Food</option>
                    </select>`
                  : `<select class="pax-berth">${berthOptions}</select>`
              }
            </div>
          </div>
        </div>`;
      })
      .join('');

    // Sync selected berth preference values when not in meal mode
    if (!hasMeals) {
      container.querySelectorAll('.passenger-card').forEach((card, idx) => {
        const sel = card.querySelector('.pax-berth');
        if (sel) sel.value = bf.passengers[idx].berthPref || 'NP';
      });
    }
  }

  function readPassengersFromDom() {
    const bf = state.bookingFlow;
    const cards = document.querySelectorAll('#passenger-rows-container .passenger-card');
    cards.forEach((card, idx) => {
      const pax = bf.passengers[idx];
      if (!pax) return;
      pax.name = card.querySelector('.pax-name').value.trim();
      pax.age = card.querySelector('.pax-age').value.trim();
      pax.gender = card.querySelector('.pax-gender').value;
      const berthEl = card.querySelector('.pax-berth');
      const mealEl = card.querySelector('.pax-meal');
      if (berthEl) pax.berthPref = berthEl.value;
      if (mealEl) pax.meal = mealEl.value;
    });
  }

  function updateFareSidebar() {
    const bf = state.bookingFlow;
    if (!bf.active) return;

    const includeIns = document.getElementById('opt-insurance').checked;
    const fare = computeFareBreakdown(
      bf.train,
      bf.classCode,
      bf.segment.distanceKm,
      state.search.quota,
      bf.paxCount,
      includeIns
    );

    const rows = [
      ['Base Ticket Fare', formatINRExact(fare.totalBase)],
      ['Reservation Charge', formatINRExact(fare.totalRes)],
      ['Superfast Surcharge', formatINRExact(fare.totalSf)]
    ];
    if (fare.totalCatering > 0) rows.push(['Onboard Catering', formatINRExact(fare.totalCatering)]);
    if (fare.totalGst > 0) rows.push(['GST (5% AC Class)', formatINRExact(fare.totalGst)]);
    rows.push(['PRS Convenience Fee', formatINRExact(fare.convenienceFee)]);
    if (fare.insuranceFee > 0) rows.push(['Travel Insurance', formatINRExact(fare.insuranceFee)]);

    document.getElementById('fare-breakdown-body').innerHTML = `
      <div class="fare-line"><span>Passengers</span><strong class="mono">${bf.paxCount} &times; ${bf.classCode}</strong></div>
      ${rows.map(([label, val]) => `<div class="fare-line"><span>${label}</span><span class="mono">${val}</span></div>`).join('')}
      <div class="fare-total">
        <span>Total Payable</span>
        <span class="mono">${formatINRExact(fare.grandTotal)}</span>
      </div>`;
  }

  function validateStep2AndAdvance() {
    readPassengersFromDom();
    const bf = state.bookingFlow;
    const errEl = document.getElementById('step-2-error');
    errEl.textContent = '';

    for (let i = 0; i < bf.passengers.length; i++) {
      const p = bf.passengers[i];
      if (p.name.length < 2) {
        errEl.textContent = `Please enter a valid full name for Passenger ${i + 1}.`;
        return;
      }
      const ageNum = Number(p.age);
      if (!Number.isFinite(ageNum) || ageNum < 1 || ageNum > 115) {
        errEl.textContent = `Please enter a valid age (1–115) for Passenger ${i + 1}.`;
        return;
      }
      if (state.search.quota === 'LD' && p.gender === 'M' && ageNum >= 12) {
        errEl.textContent = 'Ladies Quota (LD) is restricted to female passengers and children under 12.';
        return;
      }
      if (state.search.quota === 'SS') {
        const eligible = (p.gender === 'M' && ageNum >= 60) || (p.gender === 'F' && ageNum >= 45);
        if (!eligible) {
          errEl.textContent = 'Senior Citizen / Lower Berth Quota requires Male 60+ or Female 45+.';
          return;
        }
      }
    }

    const mobile = document.getElementById('contact-mobile').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      errEl.textContent = 'Enter a valid 10-digit Indian mobile number (starting with 6–9).';
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errEl.textContent = 'Enter a valid email address for e-ticket delivery.';
      return;
    }

    renderReviewStep3();
    setBookingStep(3);
  }

  function renderReviewStep3() {
    const bf = state.bookingFlow;
    const boardingCode = document.getElementById('boarding-station').value;
    const boardingSt = STATION_MAP[boardingCode];

    const paxRows = bf.passengers
      .map((p, i) => {
        const seat = bf.selectedSeats[i];
        const seatInfo = seat ? `${seat.coach} / ${seat.number} (${seat.berthType})` : `Auto (${p.berthPref})`;
        return `
        <tr>
          <td>${i + 1}</td>
          <td><strong>${escapeHtml(p.name)}</strong></td>
          <td class="mono">${p.age} / ${p.gender}</td>
          <td class="mono">${seatInfo}</td>
          <td>${escapeHtml(p.meal)}</td>
        </tr>`;
      })
      .join('');

    document.getElementById('review-summary-block').innerHTML = `
      <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
        <div>
          <strong>${bf.train.number} ${escapeHtml(bf.train.name)}</strong>
          <div class="muted-text">Boarding: ${escapeHtml(boardingSt.name)} (${boardingCode}) &bull; Date: ${formatDisplayDate(state.search.date)}</div>
        </div>
        <span class="badge badge-neutral">${bf.classCode} &bull; ${QUOTA_META[state.search.quota].label}</span>
      </div>
      <table class="data-table">
        <thead>
          <tr><th>#</th><th>Passenger Name</th><th>Age/Sex</th><th>Coach / Berth</th><th>Meal</th></tr>
        </thead>
        <tbody>${paxRows}</tbody>
      </table>`;
  }

  function completeBookingPayment() {
    const bf = state.bookingFlow;
    const errEl = document.getElementById('step-3-error');
    errEl.textContent = '';

    let paymentLabel = 'UPI';
    if (bf.paymentMethod === 'upi') {
      const vpa = document.getElementById('upi-id-input').value.trim();
      if (!vpa.includes('@')) {
        errEl.textContent = 'Please enter a valid UPI ID (e.g. name@upi).';
        return;
      }
      paymentLabel = `UPI (${vpa})`;
    } else if (bf.paymentMethod === 'card') {
      const cardNum = document.getElementById('card-num-input').value.replace(/\s+/g, '');
      const exp = document.getElementById('card-exp-input').value.trim();
      const cvv = document.getElementById('card-cvv-input').value.trim();
      if (!/^\d{16}$/.test(cardNum) || !/^\d{2}\/\d{2}$/.test(exp) || !/^\d{3}$/.test(cvv)) {
        errEl.textContent = 'Enter a valid 16-digit card number, MM/YY expiry, and 3-digit CVV.';
        return;
      }
      paymentLabel = `Card (**** ${cardNum.slice(-4)})`;
    } else if (bf.paymentMethod === 'netbanking') {
      const bank = document.getElementById('bank-select').value;
      paymentLabel = `NetBanking (${bank})`;
    } else {
      paymentLabel = 'RailWallet e-Pay';
    }

    // Determine final berth allocations for each passenger
    const meta = CLASS_META[bf.classCode];
    const availablePool = [];
    meta.coaches.forEach((cId) => {
      const seats = getCoachSeatsState(bf.train.number, state.search.date, bf.classCode, cId, state.search.quota);
      seats.forEach((s) => {
        if (s.status === 'AVAILABLE') {
          const alreadyChosen = bf.selectedSeats.some((sel) => sel.coach === cId && sel.number === s.number);
          if (!alreadyChosen) {
            availablePool.push({ coach: cId, number: s.number, berthType: s.berthType });
          }
        }
      });
    });

    const finalPassengers = bf.passengers.map((p, idx) => {
      let chosen = bf.selectedSeats[idx];
      if (!chosen && availablePool.length > 0) {
        // Prefer matching berth preference if possible
        const prefIdx = availablePool.findIndex((s) => s.berthType === p.berthPref);
        chosen = prefIdx !== -1 ? availablePool.splice(prefIdx, 1)[0] : availablePool.shift();
      }
      if (chosen) {
        return {
          ...p,
          status: 'CNF',
          coach: chosen.coach,
          seatNo: chosen.number,
          berthType: chosen.berthType
        };
      }
      return {
        ...p,
        status: 'WL',
        coach: '--',
        seatNo: `WL ${idx + 1}`,
        berthType: '--'
      };
    });

    const includeIns = document.getElementById('opt-insurance').checked;
    const fare = computeFareBreakdown(
      bf.train,
      bf.classCode,
      bf.segment.distanceKm,
      state.search.quota,
      bf.paxCount,
      includeIns
    );

    const pnr = String(Math.floor(1000000000 + Math.random() * 8999999999));
    const txId = 'TXN' + String(Math.floor(1000000000 + Math.random() * 8999999999));
    const boardingCode = document.getElementById('boarding-station').value;
    const allCnf = finalPassengers.every((p) => p.status === 'CNF');

    const newTicket = {
      pnr,
      transactionId: txId,
      bookedAt: `${toLocalDateStr(new Date())} ${new Date().toLocaleTimeString('en-IN', { hour12: false })} IST`,
      trainNumber: bf.train.number,
      trainName: bf.train.name,
      origin: bf.segment.originStop.code,
      dest: bf.segment.destStop.code,
      boarding: boardingCode,
      date: state.search.date,
      depTime: bf.segment.depTime,
      arrTime: bf.segment.arrTime,
      dayDiff: bf.segment.dayDiff,
      distanceKm: bf.segment.distanceKm,
      classCode: bf.classCode,
      quota: state.search.quota,
      status: allCnf ? 'CONFIRMED' : 'PARTIAL_WL',
      contactMobile: document.getElementById('contact-mobile').value.trim(),
      contactEmail: document.getElementById('contact-email').value.trim(),
      paymentMethod: paymentLabel,
      fare,
      passengers: finalPassengers
    };

    state.bookings.unshift(newTicket);
    saveBookings(state.bookings);
    updateBookingsBadge();

    bf.confirmedTicket = newTicket;
    document.getElementById('confirmed-ticket-container').innerHTML = renderTicketMarkup(newTicket, true);
    setBookingStep(4);
    showToast(`Ticket issued! PNR: ${pnr}`, 'success');
  }

  /* ------------------------------------------------------------------------
     9. ELECTRONIC RESERVATION SLIP (E-TICKET) & QR SVG GENERATOR
     ------------------------------------------------------------------------ */
  function generateQrSvg(seedText) {
    const size = 15;
    const cell = 5;
    const rng = mulberry32(hashString(seedText));
    let rects = '';

    function isFinder(r, c) {
      return (
        (r < 4 && c < 4) ||
        (r < 4 && c >= size - 4) ||
        (r >= size - 4 && c < 4)
      );
    }

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        let filled = false;
        if (isFinder(r, c)) {
          const lr = r >= size - 4 ? r - (size - 4) : r;
          const lc = c >= size - 4 ? c - (size - 4) : c;
          filled = lr === 0 || lr === 3 || lc === 0 || lc === 3 || (lr >= 1 && lr <= 2 && lc >= 1 && lc <= 2);
        } else {
          filled = rng() > 0.48;
        }
        if (filled) {
          rects += `<rect x="${c * cell}" y="${r * cell}" width="${cell}" height="${cell}" fill="#111C2D"/>`;
        }
      }
    }

    return `<svg width="${size * cell}" height="${size * cell}" viewBox="0 0 ${size * cell} ${size * cell}" aria-label="Ticket verification QR">${rects}</svg>`;
  }

  function getStatusBadgeClass(status) {
    if (status === 'CNF' || status === 'CONFIRMED') return 'badge-cnf';
    if (status === 'RAC') return 'badge-rac';
    return 'badge-wl';
  }

  function renderTicketMarkup(ticket, showPostBookingActions = false) {
    const originSt = STATION_MAP[ticket.origin] || { name: ticket.origin };
    const destSt = STATION_MAP[ticket.dest] || { name: ticket.dest };
    const boardingSt = STATION_MAP[ticket.boarding] || originSt;

    const paxRows = ticket.passengers
      .map(
        (p, idx) => `
      <tr>
        <td class="mono">${idx + 1}</td>
        <td><strong>${escapeHtml(p.name)}</strong></td>
        <td class="mono">${p.age} / ${p.gender}</td>
        <td><span class="badge ${getStatusBadgeClass(p.status)}">${p.status}</span></td>
        <td class="mono"><strong>${p.coach} / ${p.seatNo}${p.berthType && p.berthType !== '--' ? ` (${p.berthType})` : ''}</strong></td>
        <td>${escapeHtml(p.meal || 'No Meal')}</td>
      </tr>`
      )
      .join('');

    const postActions = showPostBookingActions
      ? `<button type="button" class="btn btn-secondary" data-new-search="true">Book Another Ticket</button>`
      : '';

    const cancelAction =
      ticket.status !== 'CANCELLED'
        ? `<button type="button" class="btn btn-danger" data-open-cancel="${ticket.pnr}">Cancel Ticket</button>`
        : `<span class="badge badge-wl">TICKET CANCELLED</span>`;

    return `
      <div class="ers-ticket">
        <div class="ers-banner">
          <div>
            <div class="ers-banner-title">ELECTRONIC RESERVATION SLIP (ERS)</div>
            <div style="font-size:12px; color:#cbd5e1;">Transaction ID: <span class="mono">${ticket.transactionId}</span> &bull; Booked: ${ticket.bookedAt}</div>
          </div>
          <div class="ers-pnr-box">
            <span class="ers-pnr-label">PNR Number</span>
            <span class="ers-pnr-val">${ticket.pnr}</span>
          </div>
        </div>

        <div class="ers-body">
          <div class="ers-journey-grid">
            <div>
              <div class="train-identity">
                <span class="train-num-badge">${ticket.trainNumber}</span>
                <strong style="font-size:16px;">${escapeHtml(ticket.trainName)}</strong>
                <span class="badge ${getStatusBadgeClass(ticket.status)}">${ticket.status}</span>
              </div>
              <div class="ers-meta-grid">
                <div class="meta-cell">
                  <label>From / Boarding</label>
                  <span>${escapeHtml(boardingSt.name)} (${ticket.boarding})</span>
                </div>
                <div class="meta-cell">
                  <label>To Station</label>
                  <span>${escapeHtml(destSt.name)} (${ticket.dest})</span>
                </div>
                <div class="meta-cell">
                  <label>Date &amp; Departure</label>
                  <span class="mono">${formatDisplayDate(ticket.date)} &bull; ${ticket.depTime}</span>
                </div>
                <div class="meta-cell">
                  <label>Class / Quota</label>
                  <span class="mono">${ticket.classCode} (${CLASS_META[ticket.classCode].name}) &bull; ${ticket.quota}</span>
                </div>
              </div>
            </div>
            <div class="ers-qr-box">
              ${generateQrSvg(`${ticket.pnr}|${ticket.trainNumber}|${ticket.date}`)}
              <span class="mono">PNR ${ticket.pnr}</span>
            </div>
          </div>

          <h3 class="ers-section-title">Passenger Reservation Details</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Age/Sex</th>
                <th>Status</th>
                <th>Coach / Berth</th>
                <th>Meal</th>
              </tr>
            </thead>
            <tbody>${paxRows}</tbody>
          </table>

          <h3 class="ers-section-title">Payment Summary (${escapeHtml(ticket.paymentMethod)})</h3>
          <div style="display:flex; gap:20px; flex-wrap:wrap; font-size:13px;">
            <span>Ticket Fare: <strong class="mono">${formatINRExact(ticket.fare.totalBase + ticket.fare.totalRes + ticket.fare.totalSf + ticket.fare.totalCatering)}</strong></span>
            <span>GST: <strong class="mono">${formatINRExact(ticket.fare.totalGst)}</strong></span>
            <span>Conv. &amp; Ins.: <strong class="mono">${formatINRExact(ticket.fare.convenienceFee + ticket.fare.insuranceFee)}</strong></span>
            <span>Total Paid: <strong class="mono">${formatINRExact(ticket.fare.grandTotal)}</strong></span>
            ${ticket.refundAmount !== undefined ? `<span>Refund Credited: <strong class="mono" style="color:var(--status-cnf-ink);">${formatINRExact(ticket.refundAmount)}</strong></span>` : ''}
          </div>

          <div class="ers-instructions">
            <strong>Important Journey Instructions:</strong>
            <ul>
              <li>At least one passenger must carry an original valid government photo ID (Aadhaar, Passport, Voter ID, Driving Licence, or PAN) during the journey.</li>
              <li>Boarding is permitted from <strong>${escapeHtml(boardingSt.name)} (${ticket.boarding})</strong> at <strong>${ticket.depTime}</strong>.</li>
              <li>Final reservation chart is prepared 4 hours prior to scheduled departure.</li>
            </ul>
          </div>

          <div class="ers-actions no-print">
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <button type="button" class="btn btn-primary" onclick="window.print()">Print e-Ticket</button>
              ${cancelAction}
            </div>
            ${postActions}
          </div>
        </div>
      </div>`;
  }

  /* ------------------------------------------------------------------------
     10. PNR STATUS, SCHEDULE VIEW & MY BOOKINGS / CANCELLATION ENGINE
     ------------------------------------------------------------------------ */
  function lookupPnr(pnrStr) {
    const clean = pnrStr.trim();
    const out = document.getElementById('pnr-result-area');
    if (!/^\d{10}$/.test(clean)) {
      out.innerHTML = `<div class="card form-error">Please enter a valid 10-digit numeric PNR number.</div>`;
      return;
    }

    const ticket = state.bookings.find((b) => b.pnr === clean);
    if (!ticket) {
      out.innerHTML = `
        <div class="card empty-state">
          <strong>PNR ${escapeHtml(clean)} not found in current PRS records.</strong>
          <p>Try one of the sample PNRs above or check a PNR generated from your bookings.</p>
        </div>`;
      return;
    }

    out.innerHTML = renderTicketMarkup(ticket, false);
  }

  function populateScheduleDropdown() {
    const sel = document.getElementById('schedule-train-select');
    sel.innerHTML = TRAINS.map((t) => {
      const first = t.stops[0].code;
      const last = t.stops[t.stops.length - 1].code;
      return `<option value="${t.number}">${t.number} — ${escapeHtml(t.name)} (${first} &rarr; ${last})</option>`;
    }).join('');
  }

  function renderScheduleView(trainNumber) {
    const sel = document.getElementById('schedule-train-select');
    const num = trainNumber || sel.value || TRAINS[0].number;
    sel.value = num;
    const train = TRAIN_MAP[num];
    if (!train) return;

    const totalDist = train.stops[train.stops.length - 1].dist;
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const activeDays = train.runsOn.map((on, i) => (on ? dayNames[i] : null)).filter(Boolean).join(', ');

    const rowsHtml = train.stops
      .map((s, idx) => {
        const st = STATION_MAP[s.code];
        return `
        <tr class="${idx === 0 || idx === train.stops.length - 1 ? 'stop-row-current' : ''}">
          <td class="mono">${idx + 1}</td>
          <td><strong>${s.code}</strong></td>
          <td><strong>${escapeHtml(st.name)}</strong> <span class="muted-text">(${st.city})</span></td>
          <td class="mono">${s.arr}</td>
          <td class="mono">${s.dep}</td>
          <td class="mono">${s.halt > 0 ? s.halt + ' min' : '--'}</td>
          <td class="mono">${s.dist} km</td>
          <td class="mono">Day ${s.day}</td>
          <td class="mono">PF ${s.pf}</td>
        </tr>`;
      })
      .join('');

    document.getElementById('schedule-detail-area').innerHTML = `
      <div class="schedule-summary-bar">
        <div>
          <div class="train-identity">
            <span class="train-num-badge">${train.number}</span>
            <strong style="font-size:17px;">${escapeHtml(train.name)}</strong>
            <span class="train-type-tag">${train.category}</span>
          </div>
          <p class="muted-text" style="margin-top:4px;">
            Runs on: <strong>${activeDays}</strong> &bull; Total Distance: <strong class="mono">${totalDist} km</strong> &bull;
            Classes: <strong class="mono">${train.classes.join(', ')}</strong>
          </p>
        </div>
        <span class="badge badge-cnf">${train.pantry ? 'Pantry Car Available' : 'No Pantry Car'}</span>
      </div>

      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Code</th>
              <th>Station Name</th>
              <th>Arrival</th>
              <th>Departure</th>
              <th>Halt</th>
              <th>Distance</th>
              <th>Day</th>
              <th>Platform</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>`;
  }

  function renderBookingsView() {
    const listEl = document.getElementById('bookings-list-area');
    const filtered = state.bookings.filter((b) => {
      if (state.bookingsFilter === 'ALL') return true;
      if (state.bookingsFilter === 'CANCELLED') return b.status === 'CANCELLED';
      return b.status !== 'CANCELLED';
    });

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div class="card empty-state">
          <strong>No reservations under "${state.bookingsFilter}".</strong>
          <p>Switch filter tabs or book a new rail journey from the Book Tickets tab.</p>
        </div>`;
      return;
    }

    listEl.innerHTML = filtered
      .map((bk) => {
        const originSt = STATION_MAP[bk.origin] || { name: bk.origin };
        const destSt = STATION_MAP[bk.dest] || { name: bk.dest };
        const paxBadges = bk.passengers
          .map(
            (p) =>
              `<span class="chip-btn" style="cursor:default;">${escapeHtml(p.name)} &bull; <span class="mono">${p.status} ${p.coach !== '--' ? `${p.coach}-${p.seatNo}` : ''}</span></span>`
          )
          .join('');

        return `
        <article class="card booking-history-card">
          <div class="booking-history-head">
            <div class="train-identity">
              <span class="train-num-badge">${bk.trainNumber}</span>
              <strong>${escapeHtml(bk.trainName)}</strong>
              <span class="badge ${getStatusBadgeClass(bk.status)}">${bk.status}</span>
            </div>
            <div>
              <span class="muted-text">PNR:</span>
              <strong class="mono" style="font-size:15px;">${bk.pnr}</strong>
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:12px;">
            <div>
              <strong>${escapeHtml(originSt.name)} (${bk.origin}) &rarr; ${escapeHtml(destSt.name)} (${bk.dest})</strong>
              <div class="muted-text mono" style="margin-top:2px;">
                ${formatDisplayDate(bk.date)} &bull; Dep ${bk.depTime} &bull; Class ${bk.classCode} (${bk.quota}) &bull; Paid ${formatINRExact(bk.fare.grandTotal)}
              </div>
            </div>
            <div class="booking-history-actions">
              <button type="button" class="btn btn-secondary btn-sm" data-view-ticket="${bk.pnr}">View / Print e-Ticket</button>
              ${
                bk.status !== 'CANCELLED'
                  ? `<button type="button" class="btn btn-danger btn-sm" data-open-cancel="${bk.pnr}">Cancel Ticket</button>`
                  : `<span class="muted-text">Refunded: <strong class="mono">${formatINRExact(bk.refundAmount || 0)}</strong></span>`
              }
            </div>
          </div>

          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            ${paxBadges}
          </div>
        </article>`;
      })
      .join('');
  }

  function calculateRefundPreview(ticket) {
    const [y, m, d] = ticket.date.split('-').map(Number);
    const [hh, mm] = ticket.depTime.split(':').map(Number);
    const depDate = new Date(y, m - 1, d, hh, mm);
    const hoursLeft = (depDate.getTime() - Date.now()) / (1000 * 60 * 60);

    const paxCount = ticket.passengers.length;
    const ticketBaseAndTax = ticket.fare.grandTotal - ticket.fare.convenienceFee - ticket.fare.insuranceFee;

    let ruleLabel = '';
    let deduction = 0;

    if (ticket.quota === 'TQ' && ticket.status === 'CONFIRMED') {
      ruleLabel = 'Confirmed Tatkal Ticket: Zero refund per PRS Tatkal policy.';
      deduction = ticketBaseAndTax;
    } else if (ticket.status === 'PARTIAL_WL' && ticket.passengers.every((p) => p.status !== 'CNF')) {
      ruleLabel = 'RAC / Waitlisted Cancellation: Flat clerkage (\u20B960 + GST per passenger).';
      deduction = 65 * paxCount;
    } else if (hoursLeft >= 48) {
      const flatMap = { '1A': 240, 'EC': 240, '2A': 200, '3A': 180, '3E': 180, 'CC': 180, 'SL': 120 };
      const perPaxClerkage = flatMap[ticket.classCode] || 180;
      ruleLabel = `More than 48 hrs before departure: Flat cancellation charge (\u20B9${perPaxClerkage}/pax).`;
      deduction = perPaxClerkage * paxCount;
    } else if (hoursLeft >= 12) {
      ruleLabel = 'Between 48 hrs and 12 hrs before departure: 25% of base ticket fare deducted.';
      deduction = ticketBaseAndTax * 0.25;
    } else if (hoursLeft >= 4) {
      ruleLabel = 'Between 12 hrs and 4 hrs before departure: 50% of base ticket fare deducted.';
      deduction = ticketBaseAndTax * 0.5;
    } else {
      ruleLabel = 'Less than 4 hrs before departure: No refund admissible on confirmed berths.';
      deduction = ticketBaseAndTax;
    }

    const refundAmount = Math.max(0, Number((ticketBaseAndTax - deduction).toFixed(2)));
    return { ruleLabel, deduction: Math.min(ticketBaseAndTax, deduction), refundAmount };
  }

  /* ------------------------------------------------------------------------
     11. MODALS
     ------------------------------------------------------------------------ */
  function openModal(id) {
    document.getElementById(id).classList.remove('is-hidden');
  }

  function closeModal(id) {
    document.getElementById(id).classList.add('is-hidden');
  }

  function openRouteModal(trainNumber) {
    const train = TRAIN_MAP[trainNumber];
    if (!train) return;
    document.getElementById('route-modal-title').textContent = `${train.number} ${train.name} — Route & Halts`;
    const rows = train.stops
      .map((s, idx) => {
        const st = STATION_MAP[s.code];
        return `
        <tr>
          <td class="mono">${idx + 1}</td>
          <td><strong>${escapeHtml(st.name)} (${s.code})</strong></td>
          <td class="mono">${s.arr}</td>
          <td class="mono">${s.dep}</td>
          <td class="mono">${s.halt > 0 ? s.halt + 'm' : '--'}</td>
          <td class="mono">${s.dist} km</td>
          <td class="mono">Day ${s.day}</td>
        </tr>`;
      })
      .join('');

    document.getElementById('route-modal-body').innerHTML = `
      <table class="data-table">
        <thead>
          <tr><th>#</th><th>Station</th><th>Arr</th><th>Dep</th><th>Halt</th><th>Dist</th><th>Day</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
    openModal('route-modal');
  }

  function openTicketModal(pnr) {
    const ticket = state.bookings.find((b) => b.pnr === pnr);
    if (!ticket) return;
    document.getElementById('ticket-modal-body').innerHTML = renderTicketMarkup(ticket, false);
    openModal('ticket-modal');
  }

  function openCancelModal(pnr) {
    const ticket = state.bookings.find((b) => b.pnr === pnr);
    if (!ticket) return;
    const preview = calculateRefundPreview(ticket);

    document.getElementById('cancel-modal-body').innerHTML = `
      <p style="margin-bottom:12px;">You are cancelling <strong>PNR ${ticket.pnr}</strong> (${ticket.trainNumber} ${escapeHtml(ticket.trainName)} on ${formatDisplayDate(ticket.date)}).</p>
      <div class="review-summary-block" style="margin-bottom:14px;">
        <div class="fare-line"><span>Applicable PRS Rule</span><span style="text-align:right; max-width:260px;">${escapeHtml(preview.ruleLabel)}</span></div>
        <div class="fare-line"><span>Total Paid (incl. conv. fee)</span><span class="mono">${formatINRExact(ticket.fare.grandTotal)}</span></div>
        <div class="fare-line"><span>Cancellation Deduction</span><span class="mono">-${formatINRExact(preview.deduction)}</span></div>
        <div class="fare-total">
          <span>Net Refundable Amount</span>
          <span class="mono" style="color:var(--status-cnf-ink);">${formatINRExact(preview.refundAmount)}</span>
        </div>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button type="button" class="btn btn-secondary" data-close-modal="cancel-modal">Keep Ticket</button>
        <button type="button" class="btn btn-primary" data-confirm-cancel="${ticket.pnr}">Confirm Cancellation</button>
      </div>`;
    openModal('cancel-modal');
  }

  /* ------------------------------------------------------------------------
     12. EVENT WIRING & INITIALIZATION
     ------------------------------------------------------------------------ */
  function bindEvents() {
    // Top navigation
    document.querySelectorAll('[data-view], [data-nav]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        if (btn.tagName === 'A') e.preventDefault();
        const target = btn.dataset.view || btn.dataset.nav;
        switchView(target);
      });
    });

    // Station autocompletes
    setupStationDropdown('origin-input', 'origin-dropdown', 'origin-code-badge', (code) => {
      state.search.origin = code;
    });
    setupStationDropdown('dest-input', 'dest-dropdown', 'dest-code-badge', (code) => {
      state.search.dest = code;
    });

    // Swap stations
    document.getElementById('swap-stations-btn').addEventListener('click', () => {
      const tmp = state.search.origin;
      state.search.origin = state.search.dest;
      state.search.dest = tmp;
      syncSearchInputsFromState();
      renderTrainResults();
    });

    // Quick corridors
    document.querySelectorAll('[data-quick-route]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const [orig, dst] = btn.dataset.quickRoute.split(':');
        state.search.origin = orig;
        state.search.dest = dst;
        state.search.preferredClass = 'ALL';
        syncSearchInputsFromState();
        renderTrainResults();
      });
    });

    // Date shortcuts
    document.querySelectorAll('[data-date-offset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const offset = Number(btn.dataset.dateOffset);
        state.search.date = addDays(todayStr, offset);
        document.getElementById('journey-date').value = state.search.date;
        renderTrainResults();
      });
    });

    // Search form submit
    document.getElementById('search-form').addEventListener('submit', (e) => {
      e.preventDefault();
      state.search.date = document.getElementById('journey-date').value || defaultDateStr;
      state.search.preferredClass = document.getElementById('search-class').value;
      state.search.quota = document.getElementById('search-quota').value;
      document.getElementById('quota-policy-note').textContent = QUOTA_META[state.search.quota].note;
      renderTrainResults();
    });

    // Filters & sorting
    document.querySelectorAll('input[name="filter-type"], input[name="filter-dep"], #filter-available-only, #sort-select').forEach((el) => {
      el.addEventListener('change', renderTrainResults);
    });

    document.getElementById('reset-filters-btn').addEventListener('click', () => {
      document.querySelectorAll('input[name="filter-type"], input[name="filter-dep"]').forEach((el) => {
        el.checked = true;
      });
      document.getElementById('filter-available-only').checked = false;
      document.getElementById('sort-select').value = 'dep_asc';
      renderTrainResults();
    });

    // Delegated clicks inside Train Results
    document.getElementById('train-results-list').addEventListener('click', (e) => {
      const routeBtn = e.target.closest('[data-view-route]');
      if (routeBtn) {
        openRouteModal(routeBtn.dataset.viewRoute);
        return;
      }
      const bookTile = e.target.closest('[data-book-train]');
      if (bookTile && !bookTile.disabled) {
        startBookingFlow(bookTile.dataset.bookTrain, bookTile.dataset.bookClass);
      }
    });

    // Booking flow controls
    document.getElementById('back-to-results-btn').addEventListener('click', exitBookingFlow);

    document.getElementById('pax-count-select').addEventListener('change', (e) => {
      state.bookingFlow.paxCount = Number(e.target.value);
      syncPassengersCount();
      renderCoachMap();
      updateFareSidebar();
    });

    document.getElementById('coach-tabs').addEventListener('click', (e) => {
      const tab = e.target.closest('[data-coach-id]');
      if (!tab) return;
      state.bookingFlow.activeCoach = tab.dataset.coachId;
      renderCoachTabs();
      renderCoachMap();
    });

    document.getElementById('coach-map-grid').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-seat-num]');
      if (!btn || btn.disabled) return;
      const bf = state.bookingFlow;
      const seatNum = Number(btn.dataset.seatNum);
      const berthType = btn.dataset.berthType;
      const existingIdx = bf.selectedSeats.findIndex((s) => s.coach === bf.activeCoach && s.number === seatNum);

      if (existingIdx !== -1) {
        bf.selectedSeats.splice(existingIdx, 1);
      } else {
        if (bf.selectedSeats.length >= bf.paxCount) {
          if (bf.paxCount < 6) {
            bf.paxCount += 1;
            document.getElementById('pax-count-select').value = String(bf.paxCount);
            syncPassengersCount();
            updateFareSidebar();
          } else {
            showToast('Maximum 6 passengers allowed per PNR.', 'info');
            return;
          }
        }
        bf.selectedSeats.push({ coach: bf.activeCoach, number: seatNum, berthType });
      }
      renderCoachMap();
    });

    document.getElementById('auto-pick-seats-btn').addEventListener('click', autoAssignSeats);

    document.getElementById('to-step-2-btn').addEventListener('click', () => {
      renderPassengerFormRows();
      setBookingStep(2);
    });

    document.getElementById('add-passenger-btn').addEventListener('click', () => {
      readPassengersFromDom();
      const bf = state.bookingFlow;
      if (bf.paxCount >= 6) {
        showToast('Maximum 6 passengers allowed on one PNR.', 'info');
        return;
      }
      bf.paxCount += 1;
      document.getElementById('pax-count-select').value = String(bf.paxCount);
      renderPassengerFormRows();
      updateFareSidebar();
    });

    document.getElementById('passenger-rows-container').addEventListener('click', (e) => {
      const rm = e.target.closest('[data-remove-pax]');
      if (!rm) return;
      readPassengersFromDom();
      const idx = Number(rm.dataset.removePax);
      const bf = state.bookingFlow;
      if (bf.passengers.length <= 1) return;
      bf.passengers.splice(idx, 1);
      bf.selectedSeats.splice(idx, 1);
      bf.paxCount = bf.passengers.length;
      document.getElementById('pax-count-select').value = String(bf.paxCount);
      renderPassengerFormRows();
      updateFareSidebar();
    });

    document.getElementById('opt-insurance').addEventListener('change', updateFareSidebar);

    document.getElementById('back-to-step-1-btn').addEventListener('click', () => {
      readPassengersFromDom();
      renderCoachMap();
      setBookingStep(1);
    });

    document.getElementById('to-step-3-btn').addEventListener('click', validateStep2AndAdvance);

    document.getElementById('back-to-step-2-btn').addEventListener('click', () => setBookingStep(2));

    document.querySelectorAll('.pay-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        const method = tab.dataset.payMethod;
        state.bookingFlow.paymentMethod = method;
        document.querySelectorAll('.pay-tab').forEach((t) => t.classList.toggle('is-active', t === tab));
        document.querySelectorAll('.pay-pane').forEach((p) => p.classList.toggle('is-active', p.id === `pay-pane-${method}`));
      });
    });

    document.getElementById('confirm-pay-btn').addEventListener('click', completeBookingPayment);

    // PNR Status lookup
    document.getElementById('pnr-form').addEventListener('submit', (e) => {
      e.preventDefault();
      lookupPnr(document.getElementById('pnr-input').value);
    });

    document.querySelectorAll('[data-sample-pnr]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pnr = btn.dataset.samplePnr;
        document.getElementById('pnr-input').value = pnr;
        lookupPnr(pnr);
      });
    });

    // Schedule tab
    document.getElementById('schedule-train-select').addEventListener('change', (e) => {
      renderScheduleView(e.target.value);
    });

    document.getElementById('schedule-book-btn').addEventListener('click', () => {
      const train = TRAIN_MAP[document.getElementById('schedule-train-select').value];
      if (!train) return;
      state.search.origin = train.stops[0].code;
      state.search.dest = train.stops[train.stops.length - 1].code;
      state.search.preferredClass = 'ALL';
      syncSearchInputsFromState();
      switchView('book');
      exitBookingFlow();
    });

    // Bookings filter tabs
    document.querySelectorAll('[data-booking-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.bookingsFilter = btn.dataset.bookingFilter;
        document.querySelectorAll('[data-booking-filter]').forEach((b) => b.classList.toggle('is-active', b === btn));
        renderBookingsView();
      });
    });

    // Global delegated clicks for ticket modals, cancellations, new search
    document.addEventListener('click', (e) => {
      const closeBtn = e.target.closest('[data-close-modal]');
      if (closeBtn) {
        closeModal(closeBtn.dataset.closeModal);
        return;
      }

      if (e.target.classList.contains('modal-backdrop')) {
        e.target.classList.add('is-hidden');
        return;
      }

      const viewTicketBtn = e.target.closest('[data-view-ticket]');
      if (viewTicketBtn) {
        openTicketModal(viewTicketBtn.dataset.viewTicket);
        return;
      }

      const cancelBtn = e.target.closest('[data-open-cancel]');
      if (cancelBtn) {
        openCancelModal(cancelBtn.dataset.openCancel);
        return;
      }

      const confirmCancelBtn = e.target.closest('[data-confirm-cancel]');
      if (confirmCancelBtn) {
        const pnr = confirmCancelBtn.dataset.confirmCancel;
        const ticket = state.bookings.find((b) => b.pnr === pnr);
        if (ticket && ticket.status !== 'CANCELLED') {
          const preview = calculateRefundPreview(ticket);
          ticket.status = 'CANCELLED';
          ticket.refundAmount = preview.refundAmount;
          ticket.passengers.forEach((p) => {
            p.status = 'CAN';
          });
          saveBookings(state.bookings);
          updateBookingsBadge();
          closeModal('cancel-modal');
          closeModal('ticket-modal');
          showToast(`PNR ${pnr} cancelled. Refund ${formatINRExact(preview.refundAmount)} initiated.`, 'success');
          if (state.activeView === 'bookings') renderBookingsView();
          if (state.activeView === 'pnr') lookupPnr(pnr);
          if (state.bookingFlow.active && state.bookingFlow.confirmedTicket && state.bookingFlow.confirmedTicket.pnr === pnr) {
            document.getElementById('confirmed-ticket-container').innerHTML = renderTicketMarkup(ticket, true);
          }
        }
        return;
      }

      const newSearchBtn = e.target.closest('[data-new-search]');
      if (newSearchBtn) {
        exitBookingFlow();
      }
    });
  }

  function init() {
    const dateInput = document.getElementById('journey-date');
    dateInput.min = todayStr;
    dateInput.max = addDays(todayStr, 120);

    startClock();
    syncSearchInputsFromState();
    populateScheduleDropdown();
    updateBookingsBadge();
    bindEvents();
    renderTrainResults();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
