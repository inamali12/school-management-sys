const fs = require('fs');
const path = require('path');
const { getMongoStatus } = require('../config/db');

// Import Mongoose Models
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const ClassModel = require('../models/Class');
const Attendance = require('../models/Attendance');
const Fee = require('../models/Fee');

// Local Data directory for persistence fallback
const DATA_DIR = path.join(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const getFilePath = (collection) => path.join(DATA_DIR, `${collection}.json`);

const readLocalData = (collection) => {
  const filePath = getFilePath(collection);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf8');
    return [];
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${collection}.json:`, err);
    return [];
  }
};

const writeLocalData = (collection, data) => {
  const filePath = getFilePath(collection);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
};

const generateObjectId = () => {
  const timestamp = Math.floor(Date.now() / 1000).toString(16);
  const random = 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, () => (Math.floor(Math.random() * 16)).toString(16));
  return (timestamp + random).substring(0, 24);
};

// Storage Service Wrapper
const Storage = {
  // ----------------------------------------------------
  // USERS
  // ----------------------------------------------------
  users: {
    async find(filter = {}) {
      if (getMongoStatus()) {
        return await User.find(filter).select('-password');
      }
      let items = readLocalData('users');
      return items.filter(u => {
        for (const key of Object.keys(filter)) {
          if (u[key] !== filter[key]) return false;
        }
        return true;
      }).map(({ password, ...rest }) => rest);
    },

    async findOne(filter = {}, includePassword = false) {
      if (getMongoStatus()) {
        const query = User.findOne(filter);
        if (includePassword) query.select('+password');
        return await query;
      }
      const items = readLocalData('users');
      const found = items.find(u => {
        for (const key of Object.keys(filter)) {
          if (filter[key] instanceof RegExp) {
            if (!filter[key].test(u[key])) return false;
          } else if (u[key] !== filter[key]) {
            return false;
          }
        }
        return true;
      });
      if (!found) return null;
      if (includePassword) return found;
      const { password, ...rest } = found;
      return rest;
    },

    async findById(id) {
      if (getMongoStatus()) {
        return await User.findById(id).select('-password');
      }
      const items = readLocalData('users');
      const found = items.find(u => u._id === id);
      if (!found) return null;
      const { password, ...rest } = found;
      return rest;
    },

    async create(userData) {
      if (getMongoStatus()) {
        return await User.create(userData);
      }
      const items = readLocalData('users');
      const now = new Date().toISOString();
      const newUser = {
        _id: userData._id || generateObjectId(),
        ...userData,
        createdAt: now,
        updatedAt: now
      };
      items.push(newUser);
      writeLocalData('users', items);
      const { password, ...rest } = newUser;
      return rest;
    },

    async updateById(id, updateData) {
      if (getMongoStatus()) {
        return await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
      }
      const items = readLocalData('users');
      const idx = items.findIndex(u => u._id === id);
      if (idx === -1) return null;
      items[idx] = {
        ...items[idx],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      writeLocalData('users', items);
      const { password, ...rest } = items[idx];
      return rest;
    },

    async deleteById(id) {
      if (getMongoStatus()) {
        return await User.findByIdAndDelete(id);
      }
      let items = readLocalData('users');
      const toDelete = items.find(u => u._id === id);
      items = items.filter(u => u._id !== id);
      writeLocalData('users', items);
      return toDelete;
    }
  },

  // ----------------------------------------------------
  // STUDENTS
  // ----------------------------------------------------
  students: {
    async find(query = {}) {
      if (getMongoStatus()) {
        const mQuery = {};
        if (query.className && query.className !== 'all') mQuery.className = query.className;
        if (query.section && query.section !== 'all') mQuery.section = query.section.toUpperCase();
        if (query.status && query.status !== 'all') mQuery.status = query.status;
        if (query.gender && query.gender !== 'all') mQuery.gender = query.gender;
        if (query.search) {
          const sRegex = new RegExp(query.search, 'i');
          mQuery.$or = [
            { fullName: sRegex },
            { fatherName: sRegex },
            { studentId: sRegex },
            { contactNumber: sRegex },
            { rollNumber: sRegex }
          ];
        }
        return await Student.find(mQuery).sort({ createdAt: -1 });
      }

      let items = readLocalData('students');
      if (query.className && query.className !== 'all') {
        items = items.filter(s => s.className.toLowerCase() === query.className.toLowerCase());
      }
      if (query.section && query.section !== 'all') {
        items = items.filter(s => s.section.toUpperCase() === query.section.toUpperCase());
      }
      if (query.status && query.status !== 'all') {
        items = items.filter(s => s.status.toLowerCase() === query.status.toLowerCase());
      }
      if (query.gender && query.gender !== 'all') {
        items = items.filter(s => s.gender.toLowerCase() === query.gender.toLowerCase());
      }
      if (query.search) {
        const s = query.search.toLowerCase();
        items = items.filter(item =>
          (item.fullName && item.fullName.toLowerCase().includes(s)) ||
          (item.fatherName && item.fatherName.toLowerCase().includes(s)) ||
          (item.studentId && item.studentId.toLowerCase().includes(s)) ||
          (item.contactNumber && item.contactNumber.includes(s)) ||
          (item.rollNumber && item.rollNumber.toLowerCase().includes(s))
        );
      }
      return items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    },

    async findById(id) {
      if (getMongoStatus()) {
        return await Student.findById(id);
      }
      const items = readLocalData('students');
      return items.find(s => s._id === id || s.studentId === id) || null;
    },

    async findByStudentId(studentId) {
      if (getMongoStatus()) {
        return await Student.findOne({ studentId: studentId.toUpperCase() });
      }
      const items = readLocalData('students');
      return items.find(s => s.studentId.toUpperCase() === studentId.toUpperCase()) || null;
    },

    async create(studentData) {
      if (getMongoStatus()) {
        return await Student.create(studentData);
      }
      const items = readLocalData('students');
      // Duplicate check for studentId
      const exists = items.some(s => s.studentId.toUpperCase() === studentData.studentId.toUpperCase());
      if (exists) {
        throw new Error(`Student with ID "${studentData.studentId}" already exists!`);
      }
      const now = new Date().toISOString();
      const newStudent = {
        _id: studentData._id || generateObjectId(),
        ...studentData,
        studentId: studentData.studentId.toUpperCase(),
        section: (studentData.section || 'A').toUpperCase(),
        createdAt: now,
        updatedAt: now
      };
      items.push(newStudent);
      writeLocalData('students', items);
      return newStudent;
    },

    async updateById(id, updateData) {
      if (getMongoStatus()) {
        return await Student.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
      }
      const items = readLocalData('students');
      const idx = items.findIndex(s => s._id === id || s.studentId === id);
      if (idx === -1) return null;
      items[idx] = {
        ...items[idx],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      writeLocalData('students', items);
      return items[idx];
    },

    async deleteById(id) {
      if (getMongoStatus()) {
        return await Student.findByIdAndDelete(id);
      }
      let items = readLocalData('students');
      const toDelete = items.find(s => s._id === id || s.studentId === id);
      items = items.filter(s => s._id !== id && s.studentId !== id);
      writeLocalData('students', items);
      return toDelete;
    },

    async count(filter = {}) {
      if (getMongoStatus()) {
        return await Student.countDocuments(filter);
      }
      let items = readLocalData('students');
      for (const [k, v] of Object.entries(filter)) {
        items = items.filter(item => item[k] === v);
      }
      return items.length;
    },

    async getNextStudentId() {
      let items = [];
      if (getMongoStatus()) {
        items = await Student.find({}, 'studentId').lean();
      } else {
        items = readLocalData('students');
      }
      const currentYear = new Date().getFullYear();
      let maxNum = 0;
      for (const s of items) {
        if (s.studentId && s.studentId.startsWith(`STU-${currentYear}-`)) {
          const parts = s.studentId.split('-');
          const num = parseInt(parts[2], 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      }
      const nextNum = String(maxNum + 1).padStart(3, '0');
      return `STU-${currentYear}-${nextNum}`;
    }
  },

  // ----------------------------------------------------
  // TEACHERS
  // ----------------------------------------------------
  teachers: {
    async find(query = {}) {
      if (getMongoStatus()) {
        const mQuery = {};
        if (query.status && query.status !== 'all') mQuery.status = query.status;
        if (query.subject && query.subject !== 'all') mQuery.subject = query.subject;
        if (query.assignedClass && query.assignedClass !== 'all') mQuery.assignedClass = query.assignedClass;
        if (query.search) {
          const sRegex = new RegExp(query.search, 'i');
          mQuery.$or = [
            { fullName: sRegex },
            { email: sRegex },
            { teacherId: sRegex },
            { subject: sRegex },
            { phoneNumber: sRegex }
          ];
        }
        return await Teacher.find(mQuery).sort({ createdAt: -1 });
      }

      let items = readLocalData('teachers');
      if (query.status && query.status !== 'all') {
        items = items.filter(t => t.status.toLowerCase() === query.status.toLowerCase());
      }
      if (query.subject && query.subject !== 'all') {
        items = items.filter(t => t.subject.toLowerCase() === query.subject.toLowerCase());
      }
      if (query.assignedClass && query.assignedClass !== 'all') {
        items = items.filter(t => t.assignedClass === query.assignedClass);
      }
      if (query.search) {
        const s = query.search.toLowerCase();
        items = items.filter(item =>
          (item.fullName && item.fullName.toLowerCase().includes(s)) ||
          (item.email && item.email.toLowerCase().includes(s)) ||
          (item.teacherId && item.teacherId.toLowerCase().includes(s)) ||
          (item.subject && item.subject.toLowerCase().includes(s)) ||
          (item.phoneNumber && item.phoneNumber.includes(s))
        );
      }
      return items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    },

    async findById(id) {
      if (getMongoStatus()) {
        return await Teacher.findById(id);
      }
      const items = readLocalData('teachers');
      return items.find(t => t._id === id || t.teacherId === id) || null;
    },

    async create(teacherData) {
      if (getMongoStatus()) {
        return await Teacher.create(teacherData);
      }
      const items = readLocalData('teachers');
      // Duplicate check for teacherId & email
      if (items.some(t => t.teacherId.toUpperCase() === teacherData.teacherId.toUpperCase())) {
        throw new Error(`Teacher with ID "${teacherData.teacherId}" already exists!`);
      }
      if (items.some(t => t.email.toLowerCase() === teacherData.email.toLowerCase())) {
        throw new Error(`Teacher with email "${teacherData.email}" already exists!`);
      }
      const now = new Date().toISOString();
      const newTeacher = {
        _id: teacherData._id || generateObjectId(),
        ...teacherData,
        teacherId: teacherData.teacherId.toUpperCase(),
        email: teacherData.email.toLowerCase(),
        createdAt: now,
        updatedAt: now
      };
      items.push(newTeacher);
      writeLocalData('teachers', items);
      return newTeacher;
    },

    async updateById(id, updateData) {
      if (getMongoStatus()) {
        return await Teacher.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
      }
      const items = readLocalData('teachers');
      const idx = items.findIndex(t => t._id === id || t.teacherId === id);
      if (idx === -1) return null;
      items[idx] = {
        ...items[idx],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      writeLocalData('teachers', items);
      return items[idx];
    },

    async deleteById(id) {
      if (getMongoStatus()) {
        return await Teacher.findByIdAndDelete(id);
      }
      let items = readLocalData('teachers');
      const toDelete = items.find(t => t._id === id || t.teacherId === id);
      items = items.filter(t => t._id !== id && t.teacherId !== id);
      writeLocalData('teachers', items);
      return toDelete;
    },

    async count(filter = {}) {
      if (getMongoStatus()) {
        return await Teacher.countDocuments(filter);
      }
      let items = readLocalData('teachers');
      for (const [k, v] of Object.entries(filter)) {
        items = items.filter(item => item[k] === v);
      }
      return items.length;
    },

    async getNextTeacherId() {
      let items = [];
      if (getMongoStatus()) {
        items = await Teacher.find({}, 'teacherId').lean();
      } else {
        items = readLocalData('teachers');
      }
      const currentYear = new Date().getFullYear();
      let maxNum = 0;
      for (const t of items) {
        if (t.teacherId && t.teacherId.startsWith(`TCH-${currentYear}-`)) {
          const parts = t.teacherId.split('-');
          const num = parseInt(parts[2], 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      }
      const nextNum = String(maxNum + 1).padStart(3, '0');
      return `TCH-${currentYear}-${nextNum}`;
    }
  },

  // ----------------------------------------------------
  // CLASSES
  // ----------------------------------------------------
  classes: {
    async find() {
      if (getMongoStatus()) {
        return await ClassModel.find().sort({ numericGrade: 1 });
      }
      const items = readLocalData('classes');
      return items.sort((a, b) => (a.numericGrade || 0) - (b.numericGrade || 0));
    },

    async findById(id) {
      if (getMongoStatus()) {
        return await ClassModel.findById(id);
      }
      const items = readLocalData('classes');
      return items.find(c => c._id === id || c.name === id) || null;
    },

    async findByName(name) {
      if (getMongoStatus()) {
        return await ClassModel.findOne({ name });
      }
      const items = readLocalData('classes');
      return items.find(c => c.name.toLowerCase() === name.toLowerCase()) || null;
    },

    async create(classData) {
      if (getMongoStatus()) {
        return await ClassModel.create(classData);
      }
      const items = readLocalData('classes');
      if (items.some(c => c.name.toLowerCase() === classData.name.toLowerCase())) {
        throw new Error(`Class "${classData.name}" already exists!`);
      }
      const now = new Date().toISOString();
      const newClass = {
        _id: classData._id || generateObjectId(),
        ...classData,
        createdAt: now,
        updatedAt: now
      };
      items.push(newClass);
      writeLocalData('classes', items);
      return newClass;
    },

    async updateById(id, updateData) {
      if (getMongoStatus()) {
        return await ClassModel.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
      }
      const items = readLocalData('classes');
      const idx = items.findIndex(c => c._id === id || c.name === id);
      if (idx === -1) return null;
      items[idx] = {
        ...items[idx],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      writeLocalData('classes', items);
      return items[idx];
    },

    async deleteById(id) {
      if (getMongoStatus()) {
        return await ClassModel.findByIdAndDelete(id);
      }
      let items = readLocalData('classes');
      const toDelete = items.find(c => c._id === id || c.name === id);
      items = items.filter(c => c._id !== id && c.name !== id);
      writeLocalData('classes', items);
      return toDelete;
    },

    async count() {
      if (getMongoStatus()) {
        return await ClassModel.countDocuments();
      }
      return readLocalData('classes').length;
    }
  },

  // ----------------------------------------------------
  // ATTENDANCE
  // ----------------------------------------------------
  attendance: {
    async find(query = {}) {
      if (getMongoStatus()) {
        const mQuery = {};
        if (query.date) mQuery.date = query.date;
        if (query.className && query.className !== 'all') mQuery.className = query.className;
        if (query.section && query.section !== 'all') mQuery.section = query.section.toUpperCase();
        if (query.studentId) mQuery.studentId = query.studentId.toUpperCase();
        if (query.status && query.status !== 'all') mQuery.status = query.status;
        if (query.startDate && query.endDate) {
          mQuery.date = { $gte: query.startDate, $lte: query.endDate };
        }
        return await Attendance.find(mQuery).sort({ date: -1, studentName: 1 });
      }

      let items = readLocalData('attendance');
      if (query.date) items = items.filter(a => a.date === query.date);
      if (query.className && query.className !== 'all') {
        items = items.filter(a => a.className.toLowerCase() === query.className.toLowerCase());
      }
      if (query.section && query.section !== 'all') {
        items = items.filter(a => a.section.toUpperCase() === query.section.toUpperCase());
      }
      if (query.studentId) {
        items = items.filter(a => a.studentId.toUpperCase() === query.studentId.toUpperCase());
      }
      if (query.status && query.status !== 'all') {
        items = items.filter(a => a.status.toLowerCase() === query.status.toLowerCase());
      }
      if (query.startDate && query.endDate) {
        items = items.filter(a => a.date >= query.startDate && a.date <= query.endDate);
      }
      return items.sort((a, b) => b.date.localeCompare(a.date));
    },

    async findById(id) {
      if (getMongoStatus()) {
        return await Attendance.findById(id);
      }
      const items = readLocalData('attendance');
      return items.find(a => a._id === id) || null;
    },

    async markRecord(data) {
      // Single record creation or update with duplicate prevention
      const studentId = data.studentId.toUpperCase();
      const date = data.date;

      if (getMongoStatus()) {
        const updated = await Attendance.findOneAndUpdate(
          { studentId, date },
          { ...data, studentId, date },
          { new: true, upsert: true, runValidators: true }
        );
        return updated;
      }

      const items = readLocalData('attendance');
      const idx = items.findIndex(a => a.studentId.toUpperCase() === studentId && a.date === date);
      const now = new Date().toISOString();

      if (idx !== -1) {
        items[idx] = {
          ...items[idx],
          ...data,
          studentId,
          date,
          updatedAt: now
        };
        writeLocalData('attendance', items);
        return items[idx];
      } else {
        const newRecord = {
          _id: data._id || generateObjectId(),
          ...data,
          studentId,
          date,
          createdAt: now,
          updatedAt: now
        };
        items.push(newRecord);
        writeLocalData('attendance', items);
        return newRecord;
      }
    },

    async markBatch(records) {
      const results = [];
      for (const rec of records) {
        const saved = await this.markRecord(rec);
        results.push(saved);
      }
      return results;
    },

    async updateById(id, updateData) {
      if (getMongoStatus()) {
        return await Attendance.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
      }
      const items = readLocalData('attendance');
      const idx = items.findIndex(a => a._id === id);
      if (idx === -1) return null;
      items[idx] = {
        ...items[idx],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      writeLocalData('attendance', items);
      return items[idx];
    },

    async deleteById(id) {
      if (getMongoStatus()) {
        return await Attendance.findByIdAndDelete(id);
      }
      let items = readLocalData('attendance');
      const toDelete = items.find(a => a._id === id);
      items = items.filter(a => a._id !== id);
      writeLocalData('attendance', items);
      return toDelete;
    },

    async getStats(query = {}) {
      const records = await this.find(query);
      const stats = {
        total: records.length,
        present: 0,
        absent: 0,
        late: 0,
        leave: 0,
        attendanceRate: 0
      };
      for (const r of records) {
        if (r.status === 'Present') stats.present++;
        else if (r.status === 'Absent') stats.absent++;
        else if (r.status === 'Late') stats.late++;
        else if (r.status === 'Leave') stats.leave++;
      }
      if (stats.total > 0) {
        stats.attendanceRate = Math.round(((stats.present + stats.late) / stats.total) * 100);
      }
      return stats;
    }
  },

  // ----------------------------------------------------
  // FEES
  // ----------------------------------------------------
  fees: {
    async find(query = {}) {
      if (getMongoStatus()) {
        const mQuery = {};
        if (query.month && query.month !== 'all') mQuery.month = query.month;
        if (query.className && query.className !== 'all') mQuery.className = query.className;
        if (query.paymentStatus && query.paymentStatus !== 'all') mQuery.paymentStatus = query.paymentStatus;
        if (query.studentId) mQuery.studentId = query.studentId.toUpperCase();
        if (query.search) {
          const sRegex = new RegExp(query.search, 'i');
          mQuery.$or = [
            { studentName: sRegex },
            { studentId: sRegex },
            { feeId: sRegex }
          ];
        }
        return await Fee.find(mQuery).sort({ createdAt: -1 });
      }

      let items = readLocalData('fees');
      if (query.month && query.month !== 'all') {
        items = items.filter(f => f.month.toLowerCase() === query.month.toLowerCase());
      }
      if (query.className && query.className !== 'all') {
        items = items.filter(f => f.className.toLowerCase() === query.className.toLowerCase());
      }
      if (query.paymentStatus && query.paymentStatus !== 'all') {
        items = items.filter(f => f.paymentStatus.toLowerCase() === query.paymentStatus.toLowerCase());
      }
      if (query.studentId) {
        items = items.filter(f => f.studentId.toUpperCase() === query.studentId.toUpperCase());
      }
      if (query.search) {
        const s = query.search.toLowerCase();
        items = items.filter(item =>
          (item.studentName && item.studentName.toLowerCase().includes(s)) ||
          (item.studentId && item.studentId.toLowerCase().includes(s)) ||
          (item.feeId && item.feeId.toLowerCase().includes(s))
        );
      }
      return items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    },

    async findById(id) {
      if (getMongoStatus()) {
        return await Fee.findById(id);
      }
      const items = readLocalData('fees');
      return items.find(f => f._id === id || f.feeId === id) || null;
    },

    async create(feeData) {
      // PREVENT DUPLICATE MONTHLY FEE RECORDS
      const studentId = feeData.studentId.toUpperCase();
      const month = feeData.month;

      if (getMongoStatus()) {
        const existing = await Fee.findOne({ studentId, month });
        if (existing) {
          throw new Error(`Fee record for student ${studentId} in month ${month} already exists!`);
        }
        return await Fee.create(feeData);
      }

      const items = readLocalData('fees');
      const existing = items.find(f => f.studentId.toUpperCase() === studentId && f.month.toLowerCase() === month.toLowerCase());
      if (existing) {
        throw new Error(`Fee record for student ${studentId} in month "${month}" already exists!`);
      }

      const now = new Date().toISOString();
      const newFee = {
        _id: feeData._id || generateObjectId(),
        payments: [],
        ...feeData,
        studentId,
        createdAt: now,
        updatedAt: now
      };
      items.push(newFee);
      writeLocalData('fees', items);
      return newFee;
    },

    async updateById(id, updateData) {
      if (getMongoStatus()) {
        return await Fee.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
      }
      const items = readLocalData('fees');
      const idx = items.findIndex(f => f._id === id || f.feeId === id);
      if (idx === -1) return null;
      items[idx] = {
        ...items[idx],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      writeLocalData('fees', items);
      return items[idx];
    },

    async recordPayment(id, { amount, paymentMethod, notes, receivedBy }) {
      const fee = await this.findById(id);
      if (!fee) throw new Error('Fee record not found');

      const payAmount = Number(amount);
      if (isNaN(payAmount) || payAmount <= 0) {
        throw new Error('Payment amount must be greater than 0');
      }

      const newPaidAmount = (Number(fee.paidAmount) || 0) + payAmount;
      const total = Number(fee.totalFee);
      const newBalance = Math.max(0, total - newPaidAmount);

      let newStatus = 'Pending';
      if (newBalance === 0) {
        newStatus = 'Paid';
      } else if (newPaidAmount > 0) {
        newStatus = 'Partial';
      }

      const paymentEntry = {
        paymentId: 'PAY-' + Date.now().toString(36).toUpperCase(),
        amount: payAmount,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: paymentMethod || 'Cash',
        receiptNo: 'REC-' + Math.floor(100000 + Math.random() * 900000),
        receivedBy: receivedBy || 'Admin',
        notes: notes || ''
      };

      const updatedPayments = [...(fee.payments || []), paymentEntry];

      const updatePayload = {
        paidAmount: newPaidAmount,
        remainingBalance: newBalance,
        paymentStatus: newStatus,
        paymentDate: paymentEntry.paymentDate,
        payments: updatedPayments
      };

      return await this.updateById(fee._id, updatePayload);
    },

    async deleteById(id) {
      if (getMongoStatus()) {
        return await Fee.findByIdAndDelete(id);
      }
      let items = readLocalData('fees');
      const toDelete = items.find(f => f._id === id || f.feeId === id);
      items = items.filter(f => f._id !== id && f.feeId !== id);
      writeLocalData('fees', items);
      return toDelete;
    },

    async getNextFeeId() {
      let items = [];
      if (getMongoStatus()) {
        items = await Fee.find({}, 'feeId').lean();
      } else {
        items = readLocalData('fees');
      }
      const currentYear = new Date().getFullYear();
      let maxNum = 0;
      for (const f of items) {
        if (f.feeId && f.feeId.startsWith(`FEE-${currentYear}-`)) {
          const parts = f.feeId.split('-');
          const num = parseInt(parts[2], 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      }
      const nextNum = String(maxNum + 1).padStart(4, '0');
      return `FEE-${currentYear}-${nextNum}`;
    },

    async getStats() {
      const records = await this.find({});
      let totalCollected = 0;
      let totalPending = 0;
      let paidCount = 0;
      let partialCount = 0;
      let pendingCount = 0;
      let overdueCount = 0;

      for (const r of records) {
        totalCollected += Number(r.paidAmount) || 0;
        totalPending += Number(r.remainingBalance) || 0;
        if (r.paymentStatus === 'Paid') paidCount++;
        else if (r.paymentStatus === 'Partial') partialCount++;
        else if (r.paymentStatus === 'Pending') pendingCount++;
        else if (r.paymentStatus === 'Overdue') overdueCount++;
      }

      return {
        totalFeesCount: records.length,
        totalCollected,
        totalPending,
        paidCount,
        partialCount,
        pendingCount,
        overdueCount
      };
    }
  }
};

module.exports = Storage;
