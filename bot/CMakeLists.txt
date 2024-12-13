cmake_minimum_required(VERSION 3.10)
project(brainbot VERSION 1.0)
set(CMAKE_CXX_STANDARD 20)

include_directories(includes)

find_package(Threads REQUIRED)
find_package(OpenSSL REQUIRED)
find_package(DPP REQUIRED)
find_package(mongocxx REQUIRED)
find_package(bsoncxx REQUIRED)

include_directories(/usr/include/mongocxx/v_noabi)
include_directories(/usr/include/bsoncxx/v_noabi)

find_package(hiredis QUIET)
if (NOT hiredis_FOUND)
  find_path(HIREDIS_HEADER hiredis)
  find_library(HIREDIS_LIB hiredis)
endif()

find_package(fmt REQUIRED)
find_package(spdlog REQUIRED)

if (NOT CMAKE_BUILD_TYPE)
  set(CMAKE_BUILD_TYPE Debug)
endif()

set(CMAKE_CXX_FLAGS_DEBUG "-g")
set(CMAKE_CXX_FLAGS_RELEASE "-O3")

add_executable(${PROJECT_NAME}
  includes/HttpStatusCodes_C++11.h
  includes/nlohmann/json.hpp
  includes/xtra/alert.h
  includes/brainbot.h
  includes/chatter.h
  includes/dbhelper.h
  includes/constants.h
  includes/collector.h
  includes/discordlog.h
  includes/httplib.h
  includes/listeners.h
  
  src/listeners/channelupdate.cpp
  src/listeners/guildcreate.cpp
  src/listeners/guilddelete.cpp
  src/listeners/guildmemberupdate.cpp
  src/listeners/keyexpires.cpp
  src/listeners/messagecreate.cpp
  src/listeners/messageupdate.cpp
  src/listeners/ready.cpp
  src/xtra/alert.cpp
  src/xtra/collector.cpp
  src/chatter.cpp
  src/dbhelper.cpp
  src/discordlog.cpp
  src/main.cpp
)

target_include_directories(${PROJECT_NAME} PRIVATE dpp hiredis pthread fmt ssl spdlog sw)
target_link_libraries(${PROJECT_NAME} PRIVATE crypto dpp hiredis pthread redis++ fmt ssl spdlog bsoncxx mongocxx)