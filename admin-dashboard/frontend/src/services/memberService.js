import api from "../api/axios";

const memberService = {
  getMembers: () => api.get("/members").then((r) => r.data),
};

export default memberService;
