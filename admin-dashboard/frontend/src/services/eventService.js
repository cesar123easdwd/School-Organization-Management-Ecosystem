import api from "../api/axios";

const eventService = {
  getEvents: () => api.get("/events").then((r) => r.data),
};

export default eventService;
