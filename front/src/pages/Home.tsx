import { useEffect, useState } from "react";
import {
  ChevronIcon,
  EllipsisIcon,
  PencilIcon,
  SearchIcon,
  TrashboxIcon,
} from "../components/Icons";
import TextInput from "@/components/TextInput";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, LogOut, Plus } from "lucide-react";
import { apiHelper } from "@/helper/apiHelpers";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { removeToken } from "@/redux/store/authSlice";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Task {
  task_id: number;
  task_title: string;
  task_description: string;
  task_status_name: string;
  task_due_date: string;
  task_status: string;
}

const Home = () => {
  document.title = "Taskify - My Tasks";
  const dispatch = useDispatch();
  const authToken = useSelector((state: RootState) => state.auth.token);

  const [taskId, settaskId] = useState("");
  const [taskTitle, settaskTitle] = useState("");
  const [taskDescription, settaskDescription] = useState("");
  const [taskStatus, settaskStatus] = useState("0");
  const [taskDate, settaskDate] = useState<Date>();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<any>("");
  const [currentPage, setcurrentPage] = useState(1);
  const [totalPages, settotalPages] = useState<any>();
  const [loadMore, setloadMore] = useState(true);

  const [tasks, setTasks] = useState<Task[]>([]);

  const [dialogModal, setdialogModal] = useState(false);
  const [filterPopup, setfilterPopup] = useState(false);

  const [dataLoading, setdataLoading] = useState(false);
  const [formLoading, setformLoading] = useState(false);

  const fetchTasks = async (page: number, resetTasks: boolean = false) => {
    if (dataLoading || !loadMore) return;
    try {
      setdataLoading(true);
      const form_data = new FormData();
      form_data.append("status_filter", filter);
      form_data.append("skip", page.toString());
      form_data.append("search", search);
      const data = await apiHelper("task/task-list", form_data, authToken);
      const fetchedData = data.task_list;

      if (resetTasks) {
        setTasks(fetchedData);
      } else {
        if (fetchedData.length > 0) {
          setTasks((prevTasks) => {
            const newTasks = fetchedData.filter(
              (task: any) => !prevTasks.some((t) => t.task_id === task.task_id)
            );
            return [...prevTasks, ...newTasks];
          });
        } else {
          setloadMore(false);
        }
      }
      settotalPages(data.total_pages);
    } catch (error: any) {
      console.log(error);
    } finally {
      setdataLoading(false);
    }
  };

  const manageTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setformLoading(true);

    try {
      const formattedDate = taskDate
        ? taskDate.toLocaleDateString("en-CA")
        : "";
      const form_data = new FormData();
      form_data.append("task_title", taskTitle);
      form_data.append("task_description", taskDescription);
      form_data.append("task_status", taskStatus);
      form_data.append("task_due_date", formattedDate);
      if (taskId) {
        form_data.append("task_id", taskId);
        await apiHelper("task/add-or-edit-task", form_data, authToken);
      } else {
        await apiHelper("task/add-or-edit-task", form_data, authToken);
      }
      setTasks([]);
      setcurrentPage(1);
      fetchTasks(1);
      setdialogModal(false);
    } catch (error: any) {
      toast.error(error.response.data.message);
      console.log(error);
    } finally {
      setformLoading(false);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const form_data = new FormData();
      form_data.append("task_id", taskId);
      await apiHelper("task/task-remove", form_data, authToken);
      setTasks((prevTasks) =>
        prevTasks.filter((task) => task.task_id.toString() !== taskId)
      );
    } catch (error: any) {
      console.error("Error while deleting task:", error);
    }
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await apiHelper("auth/logout", {}, authToken);

      dispatch(removeToken());
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const openModal = (item?: any) => {
    if (item) {
      settaskId(item.task_id);
      settaskTitle(item.task_title);
      settaskDescription(item.task_description);
      settaskStatus(item.task_status);
      settaskDate(new Date(item.task_due_date));
    } else {
      settaskId("");
      settaskTitle("");
      settaskDescription("");
      settaskStatus("0");
      settaskDate(undefined);
    }
    setdialogModal(true);
  };

  const handleFilterChange = (value: any) => {
    setFilter(value);
    setfilterPopup(false);
  };

  const handleScroll = () => {
    if (
      window.innerHeight + document.documentElement.scrollTop + 1 >=
      document.documentElement.scrollHeight
    ) {
      if (loadMore && !dataLoading && currentPage < totalPages) {
        setcurrentPage((prevPage) => prevPage + 1);
      }
    }
  };

  useEffect(() => {
    fetchTasks(currentPage);
  }, [currentPage]);

  useEffect(() => {
    setTasks([]);
    setcurrentPage(1);
    setloadMore(true);
    fetchTasks(1, true);
  }, [filter, search]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [loadMore, dataLoading]);

  const getFilterLabel = () => {
    switch (filter) {
      case "":
        return "All";
      case 0:
        return "Pending";
      case 1:
        return "Processing";
      case 2:
        return "Completed";
      default:
        return "All";
    }
  };

  return (
    <main>
      <div className="w-full min-h-dvh p-4 sm:p-10 space-y-6 bg-gradient-to-r from-sky-800/15 to-orange-800/15">
        <div className="flex justify-between items-center p-4 sm:p-6 rounded-xl bg-white">
          <h1 className="text-xl sm:text-2xl font-semibold">Dashboard</h1>
          <div className="flex gap-2">
            <Button
              className="max-lg:fixed right-2 bottom-2 max-lg:size-12 lg:py-2 max-sm:text-xs font-semibold max-lg:rounded-full"
              onClick={() => openModal()}
            >
              <span className="max-lg:hidden">New Task</span>
              <span className="lg:hidden">
                <Plus className="size-7" />
              </span>
            </Button>

            <Button
              className="px-3 py-2 max-sm:text-xs font-semibold"
              onClick={handleLogout}
            >
              <LogOut className="size-5" />
            </Button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4 rounded-xl bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between max-sm:gap-2">
            <div className="relative max-w-lg w-full flex items-center">
              <SearchIcon className="absolute size-5 left-3 text-neutral-400" />
              <input
                type="text"
                name="search"
                id="search"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full ps-10 px-4 py-2 sm:py-2.5 max-sm:text-sm outline-none rounded-lg border-2 border-neutral-200 hover:border-neutral-400 focus:border-neutral-800 transition-all ease-in-out duration-300"
              />
            </div>

            <div className="flex justify-end">
              <Popover open={filterPopup} onOpenChange={setfilterPopup}>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1 px-3 py-2 text-sm font-bold rounded-md outline-none hover:bg-gray-100 transition ease-in-out duration-300">
                    {getFilterLabel()}
                    <ChevronIcon className="size-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-40 mt-1" align="end">
                  <div className="flex flex-col bg-white">
                    <button
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition ease-in-out duration-300"
                      onClick={() => handleFilterChange("")}
                    >
                      All
                    </button>
                    <button
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition ease-in-out duration-300"
                      onClick={() => handleFilterChange(0)}
                    >
                      Pending
                    </button>
                    <button
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition ease-in-out duration-300"
                      onClick={() => handleFilterChange(1)}
                    >
                      Processing
                    </button>
                    <button
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition ease-in-out duration-300"
                      onClick={() => handleFilterChange(2)}
                    >
                      Completed
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <div className="grid grid-cols-12 items-center p-4 max-sm:text-sm bg-gray-100">
              <div className="col-span-6 sm:col-span-8">
                <h1 className="font-semibold">Task name</h1>
              </div>
              <div className="col-span-3 sm:col-span-2">
                <h1 className="font-semibold">Status</h1>
              </div>
              <div className="text-center col-span-3 sm:col-span-2">
                <h1 className="font-semibold">Actions</h1>
              </div>
            </div>

            {tasks.length > 0 ? (
              tasks.map((item) => (
                <div
                  key={item.task_id}
                  className="grid grid-cols-12 items-center px-4 py-2 cursor-pointer hover:bg-gray-100"
                >
                  <div
                    className="col-span-6 sm:col-span-8 max-sm:text-sm"
                    onClick={() => openModal(item)}
                  >
                    <h1 className="">{item.task_title}</h1>
                    <p className="text-sm line-clamp-1 pe-12 text-neutral-500">
                      {item.task_description}
                    </p>
                  </div>
                  <div className="col-span-3 sm:col-span-2" onClick={() => openModal(item)}>
                    <h1
                      className={`w-fit px-3 py-0.5 text-xs sm:text-sm rounded sm:rounded-md ${
                        item.task_status_name.toLowerCase() === "pending" &&
                        "bg-sky-400/20"
                      } ${
                        item.task_status_name.toLowerCase() === "completed" &&
                        "bg-emerald-400/20"
                      } ${
                        item.task_status_name.toLowerCase() === "processing" &&
                        "bg-gray-400/20"
                      }`}
                    >
                      {item.task_status_name}
                    </h1>
                  </div>
                  <div className="col-span-3 sm:col-span-2 flex justify-center">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="size-8 sm:size-10 flex justify-center items-center rounded-full hover:bg-slate-200 transition ease-in-out duration-300">
                          <EllipsisIcon className="size-4 sm:size-[1.2rem]" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-40" align="end">
                        <div className="flex flex-col bg-white">
                          <button
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition ease-in-out duration-300"
                            onClick={() => openModal(item)}
                          >
                            <PencilIcon className="size-4" />
                            Edit
                          </button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition ease-in-out duration-300">
                                <TrashboxIcon className="size-4" />
                                Delete
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Are you absolutely sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will
                                  permanently delete this task.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    deleteTask(item.task_id.toString())
                                  }
                                  className="bg-red-700 hover:bg-red-600"
                                >
                                  Continue
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex justify-center items-center max-sm:text-sm px-4 py-4">
                <h1 className="font-semibold text-neutral-500">
                  {dataLoading ? "Loading..." : "No results found"}
                </h1>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={dialogModal} onOpenChange={setdialogModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl">
              Create Task
            </DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <div className="flex flex-col mt-6">
            <form onSubmit={manageTask} className="flex flex-col gap-6">
              <TextInput
                type="text"
                id="title"
                label="Title"
                value={taskTitle}
                onChange={(e) => settaskTitle(e.target.value)}
              />

              <div className="relative">
                <label
                  htmlFor="description"
                  className="absolute -top-2 left-2.5 px-1 text-xs font-semibold bg-white text-neutral-600"
                >
                  Description
                </label>
                <textarea
                  rows={4}
                  id="description"
                  name="description"
                  value={taskDescription}
                  onChange={(e) => settaskDescription(e.target.value)}
                  className="w-full px-4 py-3.5 outline-none rounded-lg border-2 border-neutral-200 hover:border-neutral-400 focus:border-neutral-800 transition ease-in-out duration-300"
                />
              </div>

              <Select
                value={taskStatus}
                onValueChange={(value) => settaskStatus(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="0">Pending</SelectItem>
                    <SelectItem value="1">Processing</SelectItem>
                    <SelectItem value="2">Completed</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              <div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left py-3.5 font-medium border-2 border-neutral-200 hover:border-neutral-400 focus:border-neutral-800",
                        !taskDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 size-4" />
                      {taskDate ? (
                        format(taskDate, "PPP")
                      ) : (
                        <span>Due date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={taskDate}
                      onSelect={settaskDate}
                      initialFocus
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button>{formLoading ? "Saving..." : "Save"}</Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Home;
