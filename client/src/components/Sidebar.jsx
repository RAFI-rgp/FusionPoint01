import React from "react";
import { assets, dummyUserData } from "../assets/assets";
import { Link, useNavigate } from "react-router-dom";
import MenuItems from "./Menuitems.jsx";
import { CirclePlus, LogOut } from "lucide-react";
import { UserButton, useClerk } from "@clerk/clerk-react";
import { useSelector } from "react-redux";

const Sidebar = ({ SidebarOpen, setSidebarOpen }) => {    //
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.value);  //
  const { signOut } = useClerk();

  return (
    <div
      className={`
        w-60 xl:w-72 bg-white border-r border-gray-200
        flex flex-col justify-between
        max-sm:absolute top-0 left-0 z-20
        ${SidebarOpen ? "translate-x-0" : "max-sm:-translate-x-full"}
        transition-all duration-300 ease-in-out
      `}
    >
      <div className="w-full">
        {/* Logo */}
        <img
          onClick={() => navigate("/")}
          src={assets.logo}
          alt="Logo"
          className="w-28 ml-6 my-3 cursor-pointer"
        />

        <hr className="border-gray-300 mb-6" />

        {/* Menu Items */}
        <MenuItems setSidebarOpen={setSidebarOpen} />

        {/* Create Post Button */}
        <Link
          to="/create-post"
          onClick={() => setSidebarOpen(false)}
          className="flex items-center justify-center gap-2 py-2.5 mt-6 mx-4 
            rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 
            hover:from-indigo-700 hover:to-purple-800 
            active:scale-95 transition text-white cursor-pointer"
        >
          <CirclePlus className="w-5 h-5" />
          Create Post
        </Link>
      </div>

      {/* Bottom User Section */}
      <div className="w-full border-t border-gray-200 p-4 px-6 flex items-center justify-between">
        <div
          className="flex gap-3 items-center cursor-pointer"
          onClick={() => navigate("/profile")}
        >
          <UserButton appearance={{ elements: { avatarBox: "w-10 h-10" } }} />

          <div className="leading-tight">
            <h1 className="text-sm font-semibold truncate max-w-[110px]">
              {user?.full_name || "User"}
            </h1>
            <p className="text-xs text-gray-500 truncate max-w-[110px]">
              @{user?.username || "username"}
            </p>
          </div>
        </div>

        <LogOut
          onClick={signOut}
          className="w-5 text-gray-500 hover:text-gray-800 transition cursor-pointer"
        />
      </div>
    </div>
  );
};

export default Sidebar;
