import api from "../api/axios";

const transactionService = {
  getTransactions: () => api.get("/transactions").then((r) => r.data),
};

export default transactionService;
