import { useState } from "react";
import {
  EyeCloseIcon,
  EyeOpenIcon,
  GithubIcon,
  GoogleIcon,
  XIcon,
} from "../components/Icons";
import TextInput from "../components/TextInput";
import { Button } from "@/components/ui/button";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { setToken } from "@/redux/store/authSlice";
import axios from "axios";

const Login = () => {
  document.title = "Taskify - Login";
  const API_URL = import.meta.env.VITE_BASE_URL;
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState("");

  const togglePassword = () => {
    setShowPassword((prevState) => !prevState);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const form_data = new FormData();
      form_data.append("user_email", email);
      form_data.append("user_password", password);

      const data = await axios.post(`${API_URL}/auth/sign-in`, form_data);

      const authToken = data.data.data.token;
      if (authToken) {
        dispatch(setToken(authToken));
        window.location.href = "/";
      }
    } catch (error) {
      const err = error as any;
      console.error("Login failed", error);
      setError(err.response.data.message);
    } finally {
      setLoading(false);
    }
  };

  console.log(token);
  return (
    <main className="">
      <div className="w-full min-h-dvh flex justify-center items-center py-20 max-sm:px-4 bg-gradient-to-r from-sky-800/15 to-orange-800/15">
        <div className="max-w-[26rem] w-full rounded-xl py-10 px-6 bg-white">
          <div className="flex flex-col items-center gap-3">
            <div className="size-24 mb-4">
              <img src="./task.png" alt="Logo" />
            </div>
            <h1 className="text-xl font-bold">Sign in to your account</h1>
            <div className="flex items-center gap-1">
              <p className="text-sm font-medium text-neutral-500">
                Don't have an account?
              </p>
              <a
                href="#"
                className="text-[0.9rem] font-semibold hover:underline text-emerald-500"
              >
                Get started
              </a>
            </div>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col mt-10 mb-6">
            <TextInput
              type="email"
              id="user_email"
              label="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="flex justify-end mt-6 mb-3">
              <a
                href="#"
                className="text-sm font-medium hover:underline text-neutral-600"
              >
                Forgot password?
              </a>
            </div>

            <div className="relative flex items-center">
              <label
                htmlFor="user_password"
                className="absolute -top-2 left-2.5 px-1 text-xs font-semibold bg-white text-neutral-600"
              >
                Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                id="user_password"
                name="user_password"
                value={password}
                placeholder="6+ characters"
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 outline-none rounded-lg border-2 border-neutral-200 hover:border-neutral-400 focus:border-neutral-800 transition-all ease-in-out duration-300"
              />
              <button
                type="button"
                className="absolute flex justify-center items-center right-1 size-9 rounded-full outline-none hover:bg-neutral-100 transition-all ease-in-out duration-300"
                onClick={togglePassword}
              >
                {showPassword ? (
                  <EyeOpenIcon className="size-5 text-neutral-500" />
                ) : (
                  <EyeCloseIcon className="size-5 text-neutral-500" />
                )}
              </button>
            </div>

            <Button type="submit" className="py-3 mt-6">
              {loading ? "Logging in..." : "Login"}
            </Button>
            {error && (
              <span className="py-2.5 mt-4 text-center text-sm font-semibold rounded-lg bg-red-100 text-red-500">
                {error}
              </span>
            )}
          </form>

          <div className="flex flex-col items-center">
            <p className="text-xs font-bold text-neutral-500">OR</p>
            <div className="flex mt-6 gap-2">
              <button className="size-10 flex justify-center items-center rounded-full hover:bg-slate-100 transition ease-in-out duration-300">
                <GoogleIcon className="size-5" />
              </button>
              <button className="size-10 flex justify-center items-center rounded-full hover:bg-slate-100 transition ease-in-out duration-300">
                <GithubIcon className="size-5" />
              </button>
              <button className="size-10 flex justify-center items-center rounded-full hover:bg-slate-100 transition ease-in-out duration-300">
                <XIcon className="size-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Login;
