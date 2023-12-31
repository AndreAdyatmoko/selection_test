const db = require('../../models');
const User = db.User;
const PayrollReport = db.PayrollReport;
const AttendanceLog = db.AttendanceLog;

const AttendanceController = {
  clockIn: async (req, res) => {
    try {
        const  {id}  = req.user;
      const clockInTime = new Date();
      await db.sequelize.transaction(async (t) => {
          const attendance = await AttendanceLog.create({
            userId: id,
            clockIn: clockInTime
          }, {transaction: t});
          res.status(201).json({ message: 'Clock in successful', attendance });
      })
    } catch (error) {
      console.error('Error clocking in:', error);
      res.status(500).json({ message: 'An error occurred while clocking in' });
    }
  },

  clockOut: async (req, res) => {
    try {
      const {id} = req.user;
      const user = await User.findByPk(id);
      console.log(user);
      const clockOutTime = new Date();
      const lastAttendance = await AttendanceLog.findOne({
        where: {
          userId : id,
        },
        order: [['clockIn', 'DESC']],
      });
      if (!lastAttendance) {
        return res.status(400).json({ message: 'No ongoing attendance found' });
      }

      lastAttendance.clockOut = clockOutTime;
      const report = await PayrollReport.findOne({
        where: {
          userId: id,
        },
      })
      console.log(report);
      report.totalSalary += user.basedsalary;
      await report.save();
      await lastAttendance.save();

      res.status(200).json({ message: 'Clock out successful', attendance: lastAttendance });
    } catch (error) {
      console.error('Error clocking out:', error);
      res.status(500).json({ message: 'An error occurred while clocking out' });
    }
  },

  getAttendanceHistory: async (req, res) => {
    try {
      const {id} = req.user;
      const attendanceHistory = await AttendanceLog.findAll({
        where:  {userId: id },
        order: [['clockIn', 'DESC']],
        include: [{ model: User}],
      });
      res.status(200).json({ attendanceHistory });
    } catch (error) {
      console.error('Error fetching attendance history:', error);
      res.status(500).json({ message: 'An error occurred while fetching attendance history' });
    }
  },

};

module.exports = AttendanceController;
