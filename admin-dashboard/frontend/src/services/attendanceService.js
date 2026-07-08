import api from "../api/axios";

const attendanceService = {
  getAttendance: () => api.get("/attendance").then((r) => r.data),
};

export default attendanceService;
