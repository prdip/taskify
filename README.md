# Taskify
##### _ReactJS & FastAPI Based Task Manager_

##
##
 ## Features
- Login & Logout
- Task list with search & status filter
- Add  Task
- Edit Task
- Delete Task

##
 ## Installation Guide
 ### ReactJS

##### Install Visual Studio Code Editor

##### Install NodeJS & NPM 

##### 1.  install nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
# download and install Node.js (you may need to restart the terminal)
nvm install 20
# Here we have used 20th version but in future use latest version with command nvm install version
# verifies the right Node.js version is in the environment
node -v # should print `v20.18.0`
# verifies the right npm version is in the environment
npm -v # should print `10.8.2`
 
##### 2. First clone this repo & navigate to front folder
##### 3. Install node libraries
##
 ```sh
npm install  
```
 ### FastAPI

 ##### 1. Before installing packages and virtual env, check python is installed or not using following command
 python3
 ##### 2. Install pip using this command
 python3 -m ensurepip --upgrade
 ##### 3. Iinstall Virtual env
 python3 -m venv venv

##### 4. Navigate to api folder
##
##### 5. Create virtual enviroment Virtualenv 
https://pypi.org/project/virtualenv/

##### 6. Activate virtual env
##
 ```sh
source venv/bin/activate
```


##### 7. Install python packages
##
 ```sh
pip3 install -r requirements.txt
```
##### 8. Go to folder - api ,   rename file .env.example to .env
##### 9. Go to folder - front , rename file .env.example to .env

##### 10. Go to Extensions in Visual Studio - install SQLite Viewer, SQLite
## How to run developent server

### ReactJS
Navigate to "front" directory && run below command
```sh
npm run dev
```
 ### FastAPI
Navigate to "api" directory && run below command
```sh
uvicorn main:app --reload
```

 Navigate to  http://localhost:5173/login
Id - admin@gmail.com
password - password
## Libraries used in ReactJS Front App
- Redux  
- ShadCN 
- Axios  
- React Redux
- React Day Picker
- React Toastify 
- Tailwind CSS 


 ## Packages used in FastAPI python API
- Alembic
- FastAPI
- SQLAlchemy
- Uvicorn
