const Cache = {
  token: null,
  getToken() {
    return this.token;
  },
  setToken(token) {
    this.token = token;
  }
};

export default Cache;
