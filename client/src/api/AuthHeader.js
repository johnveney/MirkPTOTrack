export default function authHeader() {
  const token = JSON.parse(localStorage.getItem("token"));
  
  if (token) {
    // for Node.js Express back-end
    return { "x-access-token": token  };
  } else {
    return {};
  }
}
