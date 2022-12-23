cmake_minimum_required(VERSION 3.10)

project(brainbot-gateway DESCRIPTION "gateway websocket for brainbot" LANGUAGES CXX)

include_directories(gateway)

set(CMAKE_CXX_STANDARD 17)
set(SOURCE gateway)

file(GLOB SRC ${SOURCE}/src/*.cpp)

add_executable(start-gateway-bot ${SRC})

target_include_directories(start-gateway-bot PUBLIC "${SOURCE}")
target_link_libraries(start-gateway-bot -lboost_system -lcrypto -ldpp -lssl)

add_custom_command(TARGET start-gateway-bot POST_BUILD COMMAND cp start-gateway-bot ../../start-gateway-bot)
add_custom_command(TARGET start-gateway-bot POST-BUILD rm start-gateway-bot)