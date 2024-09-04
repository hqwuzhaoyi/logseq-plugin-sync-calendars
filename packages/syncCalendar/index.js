var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { DAVClient } from "tsdav";
import ical from "ical-generator";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import utc from "dayjs/plugin/utc";
dayjs.extend(customParseFormat);
dayjs.extend(utc);
var isLogin = false;
var calendar;
var client = new DAVClient({
    serverUrl: "https://caldav.icloud.com",
    credentials: {
        username: process.env.APPLE_USER_NAME,
        password: process.env.APPLE_USER_PASSWORD,
    },
    authMethod: "Basic",
    defaultAccountType: "caldav",
});
function loginDavClient() {
    return __awaiter(this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!isLogin) return [3 /*break*/, 4];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, client.login()];
                case 2:
                    _a.sent();
                    isLogin = true;
                    console.log("Logged in to CalDAV server successfully.");
                    return [2 /*return*/, true];
                case 3:
                    error_1 = _a.sent();
                    console.error("Error logging into CalDAV server:", error_1);
                    throw error_1; // Throw the error so it can be handled where login is called
                case 4: return [2 /*return*/, true];
            }
        });
    });
}
function fetchCalendar() {
    return __awaiter(this, void 0, void 0, function () {
        var calendars, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!calendar) return [3 /*break*/, 4];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, client.fetchCalendars()];
                case 2:
                    calendars = _a.sent();
                    calendar = calendars.find(function (c) { return c.displayName === "logseq"; });
                    if (!calendar) {
                        throw new Error("No calendar found with the name 'logseq'");
                    }
                    console.log("Fetched calendar successfully");
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    console.error("Error fetching calendars:", error_2);
                    throw error_2; // Throw the error so it can be handled where the function is called
                case 4: return [2 /*return*/];
            }
        });
    });
}
function connectDav(logeseqTodos) {
    return __awaiter(this, void 0, void 0, function () {
        var _i, logeseqTodos_1, todo, startTime, endTime, events, eventICal, eventICalData, filename, eventResponse, object, error_3, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 13, , 14]);
                    return [4 /*yield*/, loginDavClient()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, fetchCalendar()];
                case 2:
                    _a.sent();
                    if (!calendar) {
                        throw new Error("No calendar found");
                    }
                    _i = 0, logeseqTodos_1 = logeseqTodos;
                    _a.label = 3;
                case 3:
                    if (!(_i < logeseqTodos_1.length)) return [3 /*break*/, 12];
                    todo = logeseqTodos_1[_i];
                    startTime = void 0, endTime = void 0;
                    if (!todo.isAllDay) {
                        startTime = dayjs.utc(todo.scheduledTime).toDate();
                        endTime = dayjs.utc(todo.scheduledTime).add(1, "hour").toDate(); // 默认1小时的事件
                    }
                    else {
                        startTime = dayjs.utc(todo.scheduledTime + "", "YYYYMMDD").toDate();
                        endTime = dayjs
                            .utc(todo.scheduledTime + "", "YYYYMMDD")
                            .add(1, "day")
                            .toDate();
                    }
                    events = [
                        {
                            start: startTime,
                            end: endTime,
                            summary: todo.text,
                            description: todo.text,
                            uid: todo.uid,
                            allDay: todo.isAllDay,
                        },
                    ];
                    eventICal = ical({ events: events });
                    eventICalData = eventICal.toString();
                    filename = "task-".concat(todo.uid, ".ics");
                    _a.label = 4;
                case 4:
                    _a.trys.push([4, 10, , 11]);
                    return [4 /*yield*/, client.fetchCalendarObjects({
                            calendar: calendar,
                            objectUrls: [filename],
                        })];
                case 5:
                    eventResponse = _a.sent();
                    console.log("eventResponse for UID ".concat(todo.uid, ":"), eventResponse);
                    if (!(eventResponse.length > 0)) return [3 /*break*/, 7];
                    object = eventResponse[0];
                    console.log("Updating event with UID: ".concat(todo.uid));
                    return [4 /*yield*/, updateEvent(__assign(__assign({}, object), { data: eventICalData }))];
                case 6:
                    _a.sent();
                    return [3 /*break*/, 9];
                case 7:
                    console.log("Creating event with UID: ".concat(todo.uid));
                    return [4 /*yield*/, createEvent(filename, calendar, eventICalData)];
                case 8:
                    _a.sent();
                    _a.label = 9;
                case 9: return [3 /*break*/, 11];
                case 10:
                    error_3 = _a.sent();
                    console.error("Error processing event for ".concat(filename, ":"), error_3);
                    return [3 /*break*/, 11];
                case 11:
                    _i++;
                    return [3 /*break*/, 3];
                case 12: return [3 /*break*/, 14];
                case 13:
                    error_4 = _a.sent();
                    console.error("Error in connectDav function:", error_4);
                    return [3 /*break*/, 14];
                case 14: return [2 /*return*/];
            }
        });
    });
}
var updateEvent = function (calendarObject) { return __awaiter(void 0, void 0, void 0, function () {
    var updateResponse, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                if (calendarObject.etag === "undefined") {
                    delete calendarObject.etag;
                }
                return [4 /*yield*/, client.updateCalendarObject({
                        calendarObject: calendarObject,
                    })];
            case 1:
                updateResponse = _a.sent();
                if (updateResponse.ok) {
                    console.log("Event successfully updated.");
                }
                else {
                    throw new Error("Failed to update event: ".concat(updateResponse.status, " ").concat(updateResponse.statusText));
                }
                return [3 /*break*/, 3];
            case 2:
                error_5 = _a.sent();
                console.error("Error updating event:", error_5);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
var createEvent = function (filename, calendar, eventICalData) { return __awaiter(void 0, void 0, void 0, function () {
    var createResponse, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, client.createCalendarObject({
                        calendar: calendar,
                        filename: filename,
                        iCalString: eventICalData,
                    })];
            case 1:
                createResponse = _a.sent();
                if (createResponse.ok) {
                    console.log("Event successfully created.");
                }
                else {
                    throw new Error("Failed to create event: ".concat(createResponse.status, " ").concat(createResponse.statusText));
                }
                return [3 /*break*/, 3];
            case 2:
                error_6 = _a.sent();
                console.error("Error creating event:", error_6);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
export function syncCalendar(logseqTodos) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connectDav(logseqTodos)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
