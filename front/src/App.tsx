import { useSelector } from "react-redux";
import Home from "./pages/Home";
import Login from "./pages/Login";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { RootState } from "./redux/store";

const isAuthenticated = () => {
  const token = useSelector((state: RootState) => state.auth.token);
  return !!token;
};

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={isAuthenticated() ? <Home /> : <Navigate to="/login" />}
          />
        </Routes>
      </Router>
      <ToastContainer />
    </>
  );
}

export default App;
