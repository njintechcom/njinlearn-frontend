import { useEffect, useRef, useState, ComponentProps } from "react";
import { useCookies } from "react-cookie";
import { Outlet, useNavigate } from "react-router-dom";
import { CgChevronDown } from "react-icons/cg";
import { DropdownItem, DropdownMenu } from "../components/dropdown";
import { DropdownMenuRefObject } from "../components/dropdown/DropdownMenu";
import {
  RiLogoutCircleLine,
  RiUser6Fill,
  RiMenu2Fill,
  RiCloseFill,
} from "react-icons/ri";
import { useFetcher } from "../utilities/fetcher";
import signOut from "../apis/auth/sign/sign-out";
import getLang from "../languages";
import { toast } from "react-toastify";
import client from "../apis/client";
import checkToken from "../apis/auth/check-token";
import NavbarList from "../components/NavbarList";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { clearUser, setUser } from "../redux/slices/user";
import { useLocation } from "react-router-dom";
import { warningAlert } from "../utilities/sweet-alert";

const menus: {
  [key: string]: (Partial<ComponentProps<typeof NavbarList>> & {
    name: string;
  })[];
} = {
  administrator: [
    {
      to: "/",
      name: "dashboard",
    },
    {
      to: "/classroom",
      name: "classroom",
    },
    {
      to: "/user",
      name: "user",
    },
    {
      to: "/setting",
      name: "setting",
    },
  ],
  teacher: [
    {
      to: "/",
      name: "dashboard",
    },
    {
      to: "/activity",
      name: "activity",
    },
    {
      to: "/chat",
      name: "chat",
    },
  ],
  student: [
    {
      to: "/",
      name: "dashboard",
    },
    {
      to: "/activity",
      name: "activity",
    },
    {
      to: "/chat",
      name: "chat",
    },
  ],
};

export default function Layout() {
  const cookie = useCookies(["token"]);
  const cookies = cookie[0];
  const removeCookies = cookie[2];
  const [mount, setMount] = useState(false);
  const navigate = useNavigate();
  const _dropdown = useRef<DropdownMenuRefObject>();
  const dispatch = useAppDispatch();
  const web = useAppSelector((state) => state.web);
  const { data: user } = useAppSelector((state) => state.user);
  const { pathname } = useLocation();
  const [menuShown, setMenuShown] = useState(false);

  const logoutFetcher = useFetcher({
    api: signOut,
    onSuccess: () => {
      dispatch(clearUser());
      removeCookies("token", {
        path: "/",
      });
    },
  });

  const checkTokenFetcher = useFetcher({
    api: checkToken,
    onSuccess: (data) => {
      dispatch(setUser(data));
      setMount(true);
    },
    onFail: (e) => {
      if (e?.response?.status === 401) {
        removeCookies("token", {
          path: "/",
        });

        toast.error(getLang().sessionExpired);
      }
    },
  });

  useEffect(() => {
    if (!cookies.token) {
      navigate("/auth/login", {
        replace: true,
        state: {
          next: pathname,
        },
      });
    } else {
      client.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${cookies.token}`;
      checkTokenFetcher.process({});
    }
  }, [cookies]);

  if (!mount) return null;

  return (
    <div className="w-full min-h-screen bg-gray-200 flex flex-col justify-start space-y-3 px-5 lg:px-8 pb-3 overflow-x-hidden">
      <div className="h-20 flex justify-between items-center relative z-20">
        <div className="flex-1 flex justify-start items-center transform -translate-x-3 lg:translate-x-0">
          <button
            type="button"
            onClick={() => setMenuShown((value) => !value)}
            className="mr-1 h-12 px-3 block lg:hidden text-gray-800"
          >
            <RiMenu2Fill className={menuShown ? "hidden" : "block"} />
            <RiCloseFill className={menuShown ? "block" : "hidden"} />
          </button>
          <div className="h-16 w-1/2 lg:w-72 bg-white rounded flex justify-center items-center">
            Logo
          </div>
        </div>
        <div
          className={`w-full lg:w-1/2 fixed lg:static top-0 mt-20 lg:mt-0 left-0 h-screen lg:h-auto p-5 pt-3 lg:p-0 transform ${
            menuShown
              ? "translate-y-0 opacity-100"
              : "-translate-y-[120%] opacity-0"
          } lg:translate-y-0 lg:opacity-100 transition duration-1000`}
        >
          <div className="w-full flex flex-col lg:flex-row justify-start lg:justify-center space-y-1 lg:space-y-0 space-x-0 lg:space-x-1 bg-white lg:bg-transparent rounded py-5 px-2 lg:p-0 shadow-md shadow-gray-200 lg:shadow-none">
            {menus[user?.role! as keyof typeof menus].map(
              ({ name, to, ...props }, index) => (
                <NavbarList
                  {...props}
                  to={to!}
                  active={web.active === name}
                  key={`${index}`}
                >
                  {getLang()[name as keyof typeof getLang]}
                </NavbarList>
              )
            )}
          </div>
        </div>
        <div className="flex-0 lg:flex-1 flex justify-end transform translate-x-5">
          <div
            onBlur={(e) => _dropdown.current?.onBlur(e)}
            className="relative flex items-center justify-end space-x-5 p-3 px-5 rounded"
          >
            <div className="w-10 h-10 lg:w-12 lg:h-12 flex-shrink-0 rounded-full bg-white relative overflow-hidden flex justify-center items-center">
              {user?.avatar && typeof user.avatar === "string" ? (
                <img src={user.avatar} className="w-full h-full object-cover" />
              ) : (
                <RiUser6Fill className="text-xl lg:text-2xl text-primary-500" />
              )}
            </div>
            <div className="hidden lg:block">
              <div className="font-bold font-nunito-sans line-clamp-1">
                {user?.fullname}
              </div>
              <div className="text-sm">
                {getLang()[user?.role as keyof ReturnType<typeof getLang>]}
              </div>
            </div>
            <div>
              <CgChevronDown />
            </div>
            <button
              type="button"
              className="absolute top-0 left-0 w-full h-full rounded"
              onClick={() => _dropdown.current?.toggle()}
            ></button>
            <DropdownMenu ref={_dropdown}>
              <DropdownItem
                onClick={() => {
                  warningAlert({
                    title: getLang().sure,
                    text: getLang().signOutConfirmation,
                    showCancelButton: true,
                    cancelButtonText: getLang().cancel,
                    confirmButtonText: getLang().yesConfirm,
                  }).then((value) => {
                    if (value.isConfirmed) {
                      toast.promise(logoutFetcher.process({}), {
                        pending: getLang().waitAMinute,
                        success: getLang().succeed,
                        error: getLang().failed,
                      });
                    }
                  });
                }}
                icon={RiLogoutCircleLine}
                element="button"
              >
                {getLang().logout}
              </DropdownItem>
            </DropdownMenu>
          </div>
        </div>
      </div>
      <div className="flex-1 bg-white rounded border border-gray-400 flex flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
