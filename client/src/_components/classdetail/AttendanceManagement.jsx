// AttendanceManagement.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Table, Checkbox, Typography, Spin, Alert, Button, message, Select, Tooltip, Modal, Popconfirm, Input, DatePicker } from 'antd'; // Thêm Button, message, Select
import moment from 'moment';
import { CloseCircleOutlined, EditOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { Option } = Select;

function getSessionDates(schedule, sessionOverrides = []) {
    const { startDate, daysOfWeek, totalSessions: initialTotalSessions } = schedule || {};

    if (!startDate || !daysOfWeek || !initialTotalSessions || initialTotalSessions <= 0) {
        console.warn("Thông tin lịch học cơ bản không đầy đủ hoặc không hợp lệ:", schedule);
        return [];
    }

    let sessions = [];
    let currentDate = moment(startDate);
    const dayMap = {
        'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
        'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };
    const numericDaysOfWeek = daysOfWeek.map(day => dayMap[day]).filter(d => d !== undefined);

    if (numericDaysOfWeek.length === 0) {
        console.warn("daysOfWeek không hợp lệ hoặc không được cung cấp.");
        return [];
    }

    // 1. Tạo danh sách buổi học cơ bản ban đầu (đủ initialTotalSessions)
    let safetyBreak = 0;
    const maxIterations = initialTotalSessions * 10; // Tăng giới hạn lặp một chút
    while (sessions.length < initialTotalSessions && safetyBreak < maxIterations) {
        if (numericDaysOfWeek.includes(currentDate.day())) {
            sessions.push({
                date: currentDate.clone(),
                type: 'scheduled', // Loại cơ bản
                reason: '',
                originalDate: null,
                isCancelledOrHoliday: false, // Cờ mới để đánh dấu buổi nghỉ/lễ
                overrideId: null // Lưu _id của override ảnh hưởng đến buổi này
            });
        }
        currentDate.add(1, 'days');
        safetyBreak++;
    }

    if (sessions.length < initialTotalSessions) {
        console.warn(`Không thể tạo đủ ${initialTotalSessions} buổi học cơ bản, chỉ tạo được ${sessions.length}.`);
    }

    // 2. Áp dụng các sessionOverrides
    const allOverrides = sessionOverrides || [];

    allOverrides.forEach(override => {
        const overrideOriginalDateMoment = override.originalDate ? moment(override.originalDate) : null;
        const overrideNewDateMoment = override.newDate ? moment(override.newDate) : null;

        if (override.type === 'cancelled' || override.type === 'holiday') {
            const dateToMark = overrideOriginalDateMoment || overrideNewDateMoment; // Ngày bị ảnh hưởng chính
            if (!dateToMark) return;

            let foundAndMarked = false;
            sessions = sessions.map(session => {
                if (session.date.isSame(dateToMark, 'day')) {
                    session.type = override.type;
                    session.reason = override.reason || (override.type === 'cancelled' ? 'Buổi học bị hủy' : 'Ngày lễ');
                    session.isCancelledOrHoliday = true;
                    session.overrideId = override._id; // Lưu ID của override
                    session.originalDate = overrideOriginalDateMoment; // Lưu lại originalDate của override này
                    foundAndMarked = true;
                }
                return session;
            });

            if (!foundAndMarked && overrideNewDateMoment) { // Thêm như một sự kiện nghỉ/lễ mới nếu không trùng ngày nào
                sessions.push({
                    date: overrideNewDateMoment.clone(),
                    type: override.type,
                    reason: override.reason || (override.type === 'cancelled' ? 'Buổi học bị hủy' : 'Ngày lễ'),
                    originalDate: overrideOriginalDateMoment,
                    isCancelledOrHoliday: true,
                    overrideId: override._id
                });
            }
        } else if (override.type === 'rescheduled') {
            if (overrideOriginalDateMoment && overrideNewDateMoment) {
                let originalSessionRescheduled = false;
                sessions = sessions.map(session => {
                    if (session.date.isSame(overrideOriginalDateMoment, 'day') && !session.isCancelledOrHoliday) { // Chỉ dời nếu buổi đó không bị hủy
                        session.date = overrideNewDateMoment.clone();
                        session.type = 'rescheduled';
                        session.reason = override.reason || 'Dời lịch';
                        session.originalDate = overrideOriginalDateMoment.clone();
                        session.isCancelledOrHoliday = false;
                        session.overrideId = override._id;
                        originalSessionRescheduled = true;
                    }
                    return session;
                });

                if (!originalSessionRescheduled) { // Nếu ngày gốc không tìm thấy hoặc đã bị hủy, coi như thêm buổi mới
                    const isNewDateOccupied = sessions.some(s => s.date.isSame(overrideNewDateMoment, 'day') && !s.isCancelledOrHoliday);
                    if (!isNewDateOccupied) {
                        sessions = sessions.filter(s => !s.date.isSame(overrideNewDateMoment, 'day')); // Xóa nếu có ngày nào (kể cả nghỉ) ở vị trí mới
                        sessions.push({
                            date: overrideNewDateMoment.clone(),
                            type: 'rescheduled',
                            reason: override.reason || 'Buổi học bù (từ dời lịch)',
                            originalDate: overrideOriginalDateMoment,
                            isCancelledOrHoliday: false,
                            overrideId: override._id
                        });
                    }
                }
            }
        } else if (override.type === 'makeup_added') {
            if (overrideNewDateMoment) {
                const isNewDateOccupied = sessions.some(s => s.date.isSame(overrideNewDateMoment, 'day') && !s.isCancelledOrHoliday);
                if (!isNewDateOccupied) {
                    sessions = sessions.filter(s => !s.date.isSame(overrideNewDateMoment, 'day'));
                    sessions.push({
                        date: overrideNewDateMoment.clone(),
                        type: 'makeup_added',
                        reason: override.reason || 'Buổi học bù',
                        originalDate: null,
                        isCancelledOrHoliday: false,
                        overrideId: override._id
                    });
                }
            }
        }
    });

    // 3. Giải quyết xung đột ngày và loại bỏ trùng lặp
    const uniqueSessionsMap = {};
    sessions.sort((a, b) => a.date.diff(b.date));

    sessions.forEach(session => {
        const dateKey = session.date.format('YYYY-MM-DD');
        const existingSessionOnDate = uniqueSessionsMap[dateKey];

        if (!existingSessionOnDate) {
            uniqueSessionsMap[dateKey] = session;
        } else {
            // Ưu tiên: Cancelled/Holiday > Rescheduled/Makeup > Scheduled
            if (session.isCancelledOrHoliday) {
                uniqueSessionsMap[dateKey] = session;
            } else if (!existingSessionOnDate.isCancelledOrHoliday) {
                if (session.type === 'rescheduled' || session.type === 'makeup_added') {
                    uniqueSessionsMap[dateKey] = session;
                } else if (existingSessionOnDate.type === 'scheduled' && (session.type !== 'scheduled')) {
                    uniqueSessionsMap[dateKey] = session;
                }
            }
        }
    });
    let processedSessions = Object.values(uniqueSessionsMap);

    // 4. Đếm số buổi có thể học và bù nếu thiếu
    let schedulableSessionsCount = processedSessions.filter(s => !s.isCancelledOrHoliday).length;
    let sessionsToMakeUp = initialTotalSessions - schedulableSessionsCount;

    if (sessionsToMakeUp > 0) {
        let lastKnownDate;
        if (processedSessions.length > 0) {
            processedSessions.sort((a, b) => a.date.diff(b.date)); // Sắp xếp lại để lấy ngày cuối cùng chính xác
            lastKnownDate = processedSessions[processedSessions.length - 1].date.clone();
        } else {
            lastKnownDate = moment(startDate).subtract(1, 'day');
        }

        let makeupSafetyBreak = 0;
        const makeupMaxIterations = (sessionsToMakeUp * 7) + (numericDaysOfWeek.length * 2) + 50;
        const existingDatesSet = new Set(processedSessions.map(s => s.date.format('YYYY-MM-DD')));

        while (sessionsToMakeUp > 0 && makeupSafetyBreak < makeupMaxIterations) {
            lastKnownDate.add(1, 'days');
            makeupSafetyBreak++;

            if (numericDaysOfWeek.includes(lastKnownDate.day())) {
                const dateKey = lastKnownDate.format('YYYY-MM-DD');
                if (!existingDatesSet.has(dateKey)) {
                    processedSessions.push({
                        date: lastKnownDate.clone(),
                        type: 'auto_makeup',
                        reason: 'Buổi bù tự động',
                        originalDate: null,
                        isCancelledOrHoliday: false,
                        overrideId: null
                    });
                    existingDatesSet.add(dateKey);
                    sessionsToMakeUp--;
                }
            }
        }
        if (sessionsToMakeUp > 0) {
            console.warn(`Không thể bù đủ ${sessionsToMakeUp} buổi học sau khi xem xét các overrides.`);
        }
    }

    // 5. Sắp xếp cuối cùng
    processedSessions.sort((a, b) => a.date.diff(b.date));
    return processedSessions;
}


const ATTENDANCE_STATUSES = {
    PRESENT: 'present',
    ABSENT: 'absent',
    LATE: 'late',
    EXCUSED_ABSENCE: 'excused_absence'
};

const STATUS_OPTIONS = [
    { value: ATTENDANCE_STATUSES.PRESENT, label: 'Có mặt' },
    { value: ATTENDANCE_STATUSES.ABSENT, label: 'Vắng' },
    { value: ATTENDANCE_STATUSES.LATE, label: 'Trễ' },
    { value: ATTENDANCE_STATUSES.EXCUSED_ABSENCE, label: 'Vắng có phép' },
];


function AttendanceManagement({ classDetails, userData, fetchWrapper, searchText: searchTextProp, onRefreshClassDetails }) {
    const [attendanceRecords, setAttendanceRecords] = useState({});
    const [sessionsState, setSessionsState] = useState({});
    const [isOverallLoading, setIsOverallLoading] = useState(false);
    const [overallError, setOverallError] = useState(null);

    const students = useMemo(() => classDetails?.students_ids || [], [classDetails]);
    const schedule = useMemo(() => classDetails?.schedule, [classDetails]);
    const classId = useMemo(() => classDetails?._id, [classDetails]);
    const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);

    const sessionDatesAndDetails = useMemo(() => {
        if (schedule) {
            return getSessionDates(schedule, schedule.sessionOverrides || []);
        }
        return [];
    }, [schedule]);

    const formatDateKey = (date) => moment(date).format('YYYY-MM-DD');

    const initializeAttendanceForStudents = useCallback((studentList, dateKeys, existingData = {}) => {
        const newRecords = {};
        studentList.forEach(Student => {
            newRecords[Student._id] = {};
            dateKeys.forEach(dateKey => {
                newRecords[Student._id][dateKey] = existingData[Student._id]?.[dateKey] || ATTENDANCE_STATUSES.ABSENT;
            });
        });
        return newRecords;
    }, []);

    useEffect(() => {
        if (!classId || sessionDatesAndDetails.length === 0 || students.length === 0) {
            setAttendanceRecords({});
            setSessionsState({});
            return;
        }

        const fetchAllAttendanceForClass = async () => {
            setIsOverallLoading(true);
            setOverallError(null);
            const initialSessionsStateFromServer = {};
            const fetchedAttendance = {};

            try {
                const response = await fetchWrapper.get(`/api/classes/${classId}/attendance-sessions`);
                const result = await response.json();

                if (result.status === "Success" && Array.isArray(result.data)) {
                    result.data.forEach(sessionDoc => {
                        const serverDateKey = formatDateKey(sessionDoc.date);
                        if (sessionDatesAndDetails.some(sDetail => formatDateKey(sDetail.date) === serverDateKey)) {
                            initialSessionsStateFromServer[serverDateKey] = {
                                isLoading: false, error: null, isModified: false, serverDataExists: true
                            };
                            sessionDoc.attendanceList.forEach(record => {
                                if (record.student_id && record.student_id._id) {
                                    if (!fetchedAttendance[record.student_id._id]) {
                                        fetchedAttendance[record.student_id._id] = {};
                                    }
                                    fetchedAttendance[record.student_id._id][serverDateKey] = record.status;
                                }
                            });
                        }
                    });
                } else if (result.status !== "Success") {
                    setOverallError(result.message || "Không thể tải dữ liệu điểm danh.");
                }
            } catch (error) {
                console.error("Lỗi khi tải dữ liệu điểm danh từ server:", error);
                setOverallError("Lỗi kết nối hoặc máy chủ khi tải dữ liệu điểm danh.");
            } finally {
                const allDateKeys = sessionDatesAndDetails.map(s => formatDateKey(s.date));
                const finalAttendanceRecords = initializeAttendanceForStudents(students, allDateKeys, fetchedAttendance);
                setAttendanceRecords(finalAttendanceRecords);

                const completeSessionsState = {};
                allDateKeys.forEach(dateKey => {
                    completeSessionsState[dateKey] = initialSessionsStateFromServer[dateKey] || {
                        isLoading: false, error: null, isModified: false, serverDataExists: false
                    };
                });
                setSessionsState(completeSessionsState);
                setIsOverallLoading(false);
            }
        };
        fetchAllAttendanceForClass();
    }, [classId, sessionDatesAndDetails, students, fetchWrapper, initializeAttendanceForStudents]);


    const handleAttendanceChange = (studentId, sessionDetail, newStatus) => {
        const dateKey = formatDateKey(sessionDetail.date);
        setAttendanceRecords(prevRecords => ({
            ...prevRecords,
            [studentId]: {
                ...(prevRecords[studentId] || {}),
                [dateKey]: newStatus,
            },
        }));
        setSessionsState(prev => ({
            ...prev,
            [dateKey]: {
                ...(prev[dateKey] || { isLoading: false, error: null, serverDataExists: false }),
                isModified: true,
            }
        }));
    };

    const handleSaveAllChanges = async () => {
        // ... (logic handleSaveAllChanges không thay đổi)
        if (!classId) {
            message.error("Không có thông tin lớp học để lưu.");
            return;
        }
        setIsOverallLoading(true);
        setOverallError(null);
        let successCount = 0;
        let errorCount = 0;

        const modifiedSessionDetails = sessionDatesAndDetails.filter(sessionDetail => {
            const dateKey = formatDateKey(sessionDetail.date);
            // Chỉ lưu những buổi không bị hủy và có thay đổi
            return !sessionDetail.isCancelledOrHoliday && sessionsState[dateKey]?.isModified;
        });

        if (modifiedSessionDetails.length === 0) {
            message.info("Không có thay đổi nào để lưu.");
            setIsOverallLoading(false);
            return;
        }

        for (const sessionDetail of modifiedSessionDetails) {
            const dateKey = formatDateKey(sessionDetail.date);
            const attendanceListPayload = students.map(Student => ({
                student_id: Student._id,
                status: attendanceRecords[Student._id]?.[dateKey] || ATTENDANCE_STATUSES.ABSENT,
            }));

            try {
                const response = await fetchWrapper.post(`/api/classes/${classId}/attendance-sessions`,
                    'application/json',
                    {
                        sessionDate: dateKey,
                        attendanceList: attendanceListPayload,
                    });
                const result = await response.json();
                if (result.status === "Success") {
                    successCount++;
                    setSessionsState(prev => ({
                        ...prev,
                        [dateKey]: { ...prev[dateKey], isModified: false, error: null, serverDataExists: true }
                    }));
                } else {
                    errorCount++;
                    setSessionsState(prev => ({
                        ...prev,
                        [dateKey]: { ...prev[dateKey], error: result.message || "Lỗi không xác định" }
                    }));
                    message.error(`Lỗi lưu ngày ${moment(dateKey).format('DD/MM')}: ${result.message}`);
                }
            } catch (err) {
                errorCount++;
                setSessionsState(prev => ({
                    ...prev,
                    [dateKey]: { ...prev[dateKey], error: err.message || "Lỗi kết nối" }
                }));
                message.error(`Lỗi mạng khi lưu ngày ${moment(dateKey).format('DD/MM')}`);
            }
        }

        setIsOverallLoading(false);
        if (successCount > 0 && errorCount === 0) {
            message.success(`Đã lưu thành công điểm danh cho ${successCount} buổi học!`);
        } else if (successCount > 0 && errorCount > 0) {
            message.warning(`Đã lưu ${successCount} buổi, ${errorCount} buổi gặp lỗi.`);
        } else if (errorCount > 0) {
            // message errors shown above
        }
    };

    const filteredStudents = useMemo(() => {
        if (!searchTextProp) return students;
        const lowerSearchText = searchTextProp.toLowerCase();
        return students.filter(Student =>
            (Student.name && Student.name.toLowerCase().includes(lowerSearchText)) ||
            (Student.vnu_id && Student.vnu_id.toLowerCase().includes(lowerSearchText))
        );
    }, [students, searchTextProp]);

    const isOverallModified = useMemo(() => {
        return Object.entries(sessionsState).some(([dateKey, state]) => {
            const sessionDetail = sessionDatesAndDetails.find(sd => formatDateKey(sd.date) === dateKey);
            return sessionDetail && !sessionDetail.isCancelledOrHoliday && state.isModified;
        });
    }, [sessionsState, sessionDatesAndDetails]);

    const activeTeachingSessions = useMemo(() => sessionDatesAndDetails.filter(s => !s.isCancelledOrHoliday).length, [sessionDatesAndDetails]);

    // --- MODAL CHO CHỈNH SỬA OVERRIDE ---
    const [isEditOverrideModalVisible, setIsEditOverrideModalVisible] = useState(false);
    const [editingOverrideDetail, setEditingOverrideDetail] = useState(null); // sessionDetail của override đang sửa
    const [editOverrideFormValues, setEditOverrideFormValues] = useState({
        type: '', // cancelled, holiday, rescheduled, makeup_added
        originalDate: null, // moment object or null
        newDate: null, // moment object or null
        reason: ''
    });

    const handleMarkAsOff = async (sessionDetailToCancel) => {
        const dateToCancelStr = moment(sessionDetailToCancel.date).format('DD/MM/YYYY');
        Modal.confirm({
            title: `Đánh dấu buổi học là nghỉ`,
            content: (
                <div>
                    <p>Bạn có chắc muốn đánh dấu buổi học ngày <strong>{dateToCancelStr}</strong> ({sessionDetailToCancel.type}) là nghỉ không?</p>
                    <p>Lý do nghỉ (không bắt buộc):</p>
                    <Input.TextArea id="markAsOffReasonInput" rows={2} placeholder="Ví dụ: Nghỉ lễ, việc đột xuất..." />
                </div>
            ),
            okText: 'Xác nhận nghỉ', okType: 'danger', cancelText: 'Không',
            onOk: async () => {
                const reason = document.getElementById('markAsOffReasonInput').value;
                setIsSubmittingOverride(true);
                try {
                    const payload = {
                        originalDate: sessionDetailToCancel.date.format('YYYY-MM-DD'), // Ngày bị hủy
                        newDate: null,
                        type: 'cancelled', // Mặc định là hủy
                        reason: reason || `Buổi học ngày ${dateToCancelStr} đã được hủy`,
                    };
                    const response = await fetchWrapper.post(`/api/classes/${classId}/schedule/overrides`, 'application/json', payload);
                    const result = await response.json();
                    if (result.status === "Success") {
                        message.success(`Đã đánh dấu buổi học ngày ${dateToCancelStr} là nghỉ.`);
                        if (onRefreshClassDetails) onRefreshClassDetails(); // Gọi callback để component cha fetch lại
                    } else {
                        message.error(result.message || 'Không thể đánh dấu nghỉ.');
                    }
                } catch (error) {
                    message.error('Lỗi kết nối.');
                } finally {
                    setIsSubmittingOverride(false);
                }
            },
        });
    };

    const handleEditOverride = (sessionDetail) => {
        setEditingOverrideDetail(sessionDetail);
        let initialOriginalDate = null;
        let initialNewDate = null;
        let initialType = sessionDetail.type; // Loại hiện tại của buổi học

        // Nếu là auto_makeup hoặc scheduled, mặc định là makeup_added khi chỉnh sửa
        if (sessionDetail.type === 'auto_makeup' || sessionDetail.type === 'scheduled') {
            initialType = 'makeup_added';
            initialNewDate = moment(sessionDetail.date); // Ngày của buổi auto_makeup/scheduled là ngày mới mặc định
            initialOriginalDate = null; // Không có originalDate cho makeup_added ban đầu
        } else if (sessionDetail.type === 'cancelled' || sessionDetail.type === 'holiday') {
            initialOriginalDate = sessionDetail.originalDate ? moment(sessionDetail.originalDate) : moment(sessionDetail.date);
            if (sessionDetail.type === 'holiday' && !sessionDetail.originalDate) initialNewDate = moment(sessionDetail.date);
        } else if (sessionDetail.type === 'rescheduled') {
            initialOriginalDate = sessionDetail.originalDate ? moment(sessionDetail.originalDate) : null;
            initialNewDate = moment(sessionDetail.date);
        } else if (sessionDetail.type === 'makeup_added') { // Buổi bù thủ công đã tồn tại
            initialNewDate = moment(sessionDetail.date);
        }


        setEditOverrideFormValues({
            type: initialType,
            originalDate: initialOriginalDate,
            newDate: initialNewDate,
            reason: sessionDetail.reason || '',
        });
        setIsEditOverrideModalVisible(true);
    };

    const handleUpdateOverrideSubmit = async () => {
        if (!editingOverrideDetail || !classId) return; // classId cũng cần có

        setIsSubmittingOverride(true);
        try {
            const payload = {
                originalDate: editOverrideFormValues.originalDate ? editOverrideFormValues.originalDate.format('YYYY-MM-DD') : null,
                newDate: editOverrideFormValues.newDate ? editOverrideFormValues.newDate.format('YYYY-MM-DD') : null,
                type: editOverrideFormValues.type,
                reason: editOverrideFormValues.reason,
            };

            // Kiểm tra payload dựa trên type
            if (payload.type === 'rescheduled' && (!payload.originalDate || !payload.newDate)) {
                message.error("Cần có ngày gốc và ngày mới cho việc dời lịch."); setIsSubmittingOverride(false); return;
            }
            if (payload.type === 'makeup_added' && !payload.newDate) {
                message.error("Cần có ngày mới cho buổi học bù."); setIsSubmittingOverride(false); return;
            }
            if (payload.type === 'cancelled' && !payload.originalDate && !editingOverrideDetail.originalDate) { // Nếu hủy buổi scheduled mà không có originalDate thì dùng ngày hiện tại
                payload.originalDate = editingOverrideDetail.date.format('YYYY-MM-DD');
            }
            if (payload.type === 'holiday' && !payload.newDate && !payload.originalDate) { // Nếu là ngày lễ thì cần ít nhất 1 ngày
                message.error("Cần có ngày cho ngày lễ."); setIsSubmittingOverride(false); return;
            }


            let response;
            let result;

            if (editingOverrideDetail.overrideId) {
                // Nếu đã có overrideId, tức là đang cập nhật một override đã tồn tại
                response = await fetchWrapper.put(`/api/classes/${classId}/schedule/overrides/${editingOverrideDetail.overrideId}`, 'application/json', payload);
            } else {
                // Nếu chưa có overrideId, tức là tạo override mới (ví dụ từ auto_makeup hoặc scheduled)
                // Cần xác định originalDate của buổi auto_makeup/scheduled bị ghi đè
                payload.originalDate = editingOverrideDetail.date.format('YYYY-MM-DD'); // Ngày của buổi đang được chỉnh sửa sẽ là originalDate
                if (payload.type === 'makeup_added' && payload.originalDate === payload.newDate) {
                    message.error("Ngày học bù mới không được trùng với ngày cũ nếu đây là buổi bù tự động.");
                    setIsSubmittingOverride(false);
                    return;
                }
                response = await fetchWrapper.post(`/api/classes/${classId}/schedule/overrides`, 'application/json', payload);
            }

            result = await response.json();

            if (result.status === "Success") {
                message.success("Đã cập nhật điều chỉnh lịch học.");
                setIsEditOverrideModalVisible(false);
                setEditingOverrideDetail(null);
                if (onRefreshClassDetails) onRefreshClassDetails(); // Gọi callback để component cha fetch lại
            } else {
                message.error(result.message || "Không thể cập nhật.");
            }
        } catch (error) {
            message.error("Lỗi kết nối khi cập nhật.");
        } finally {
            setIsSubmittingOverride(false);
        }
    };

    const handleDeleteOverrideSubmit = async () => {
        if (!editingOverrideDetail || !classId) return;

        if (!editingOverrideDetail.overrideId) {
            // Nếu không có overrideId, tức là không có override nào để xóa
            // Có thể thông báo cho người dùng hoặc chỉ đóng modal
            message.info("Không có điều chỉnh lịch học nào để xóa cho buổi này.");
            setIsEditOverrideModalVisible(false);
            setEditingOverrideDetail(null);
            return;
        }

        setIsSubmittingOverride(true);
        try {
            const response = await fetchWrapper.delete(`/api/classes/${classId}/schedule/overrides/${editingOverrideDetail.overrideId}`);
            const result = await response.json();
            if (result.status === "Success") {
                message.success("Đã xóa điều chỉnh lịch học (hoàn tác thay đổi).");
                setIsEditOverrideModalVisible(false);
                setEditingOverrideDetail(null);
                if (onRefreshClassDetails) onRefreshClassDetails();
            } else {
                message.error(result.message || "Không thể xóa.");
            }
        } catch (error) {
            message.error("Lỗi kết nối khi xóa.");
        } finally {
            setIsSubmittingOverride(false);
        }
    };


    if (!classDetails && !isOverallLoading) return <Alert message="Chưa có thông tin chi tiết lớp học." type="info" showIcon />;
    if (isOverallLoading && Object.keys(attendanceRecords).length === 0) return <Spin tip="Đang tải dữ liệu..." style={{ display: 'block', marginTop: '20px' }} />;
    if (overallError) return <Alert message={overallError} type="error" showIcon />;
    if (students.length === 0) return <Alert message="Chưa có học sinh nào trong lớp." type="info" showIcon />;
    if (sessionDatesAndDetails.length === 0 && schedule && !isOverallLoading) return <Alert message="Không thể xác định buổi học. Kiểm tra lịch học." type="warning" showIcon />;

    const columns = [
        { title: 'STT', key: 'stt', width: 60, fixed: 'left', render: (text, record, index) => filteredStudents.findIndex(s => s._id === record._id) + 1 },
        { title: 'Họ và Tên', dataIndex: 'name', key: 'name', width: 180, fixed: 'left', render: (name) => <Text>{name || 'N/A'}</Text> },
        { title: 'VNU ID', dataIndex: 'vnu_id', key: 'vnu_id', width: 110, fixed: 'left', render: (vnu_id) => <Text>{vnu_id || 'N/A'}</Text> },
        ...sessionDatesAndDetails.map((sessionDetail, index) => {
            const dateKey = formatDateKey(sessionDetail.date);
            const sessionSpecificState = sessionsState[dateKey] || {};
            let titleDisplay;
            let titleClasses = "";

            const activeSessionIndex = sessionDatesAndDetails
                .filter(s => !s.isCancelledOrHoliday)
                .findIndex(s => s.date.isSame(sessionDetail.date, 'day'));

            if (sessionDetail.isCancelledOrHoliday) {
                titleClasses = "session-cancelled";
                const typeText = sessionDetail.type === 'cancelled' ? 'Nghỉ' : 'Lễ';
                titleDisplay = (
                    <Tooltip title={`Lý do: ${sessionDetail.reason || 'Không có'}`}>
                        <Text delete style={{ color: '#a61d24' }}>
                            {sessionDetail.date.format('DD/MM')} ({typeText})
                        </Text>
                    </Tooltip>
                );
            } else {
                const currentActiveIndex = sessionDatesAndDetails.slice(0, index + 1).filter(s => !s.isCancelledOrHoliday).length;
                titleDisplay = `Buổi ${currentActiveIndex} (${sessionDetail.date.format('DD/MM')})`;
                let tooltipReason = sessionDetail.reason || 'Không có';

                if (sessionDetail.type === 'rescheduled') {
                    titleDisplay = <Tooltip title={`Dời từ: ${sessionDetail.originalDate?.format('DD/MM/YYYY') || 'N/A'}. Lý do: ${tooltipReason}`}>{`Buổi ${currentActiveIndex} (${sessionDetail.date.format('DD/MM')})*`}</Tooltip>;
                } else if (sessionDetail.type === 'makeup_added') {
                    titleDisplay = <Tooltip title={`Buổi bù. Lý do: ${tooltipReason}`}>{`Buổi ${currentActiveIndex} (${sessionDetail.date.format('DD/MM')}) +`}</Tooltip>;
                } else if (sessionDetail.type === 'auto_makeup') {
                    titleDisplay = <Tooltip title={`Buổi bù tự động. Lý do: ${tooltipReason}`}>{`Buổi ${currentActiveIndex} (${sessionDetail.date.format('DD/MM')}) ++`}</Tooltip>;
                }
            }

            return {
                title: () => (
                    <div style={{ textAlign: 'center', minWidth: 120 }} className={titleClasses}>
                        {titleDisplay}
                        {(userData?.role === 'teacher' || userData?.role === 'admin') && (
                            <Tooltip title={sessionDetail.isCancelledOrHoliday ? "Chỉnh sửa / Hoàn tác nghỉ" : "Đánh dấu nghỉ hoặc chỉnh sửa"}> {/* Thêm text gợi ý chỉnh sửa */}
                                <Button
                                    type="text"
                                    danger={!sessionDetail.isCancelledOrHoliday && sessionDetail.type === 'scheduled'} // Chỉ danger nếu là buổi scheduled gốc
                                    icon={sessionDetail.isCancelledOrHoliday ? <EditOutlined /> : <CloseCircleOutlined />}
                                    size="small"
                                    style={{ marginLeft: '5px', position: 'absolute', top: '-5px', right: '-10px', zIndex: 1 }}
                                    onClick={() => sessionDetail.isCancelledOrHoliday || sessionDetail.type === 'auto_makeup' || sessionDetail.type === 'makeup_added' || sessionDetail.type === 'rescheduled' ? handleEditOverride(sessionDetail) : handleMarkAsOff(sessionDetail)}
                                    loading={isSubmittingOverride && editingOverrideDetail?.date.isSame(sessionDetail.date, 'day')}
                                />
                            </Tooltip>
                        )}
                        {sessionSpecificState.isLoading && <Spin size="small" style={{ display: 'block' }} />}
                        {sessionSpecificState.error && <Tooltip title={sessionSpecificState.error}><Text type="danger" style={{ fontSize: '10px' }}>Lỗi!</Text></Tooltip>}
                    </div>
                ),
                dataIndex: '_id',
                key: `session_${dateKey}`,
                width: 150,
                align: 'center',
                render: (studentId, record) => {
                    if (sessionDetail.isCancelledOrHoliday) {
                        return <Tooltip title={sessionDetail.reason || 'Nghỉ'}><Text type="secondary" italic>{sessionDetail.type === 'cancelled' ? 'Nghỉ' : 'Lễ'}</Text></Tooltip>;
                    }
                    const currentStatus = attendanceRecords[studentId]?.[dateKey] || ATTENDANCE_STATUSES.ABSENT;
                    return (
                        <Select
                            value={currentStatus}
                            style={{ width: '100%' }}
                            size="small"
                            onChange={(newStatus) => handleAttendanceChange(studentId, sessionDetail, newStatus)}
                            disabled={sessionSpecificState.isLoading}
                        >
                            {STATUS_OPTIONS.map(opt => <Option key={opt.value} value={opt.value}>{opt.label}</Option>)}
                        </Select>
                    );
                },
            };
        }),
    ];

    const renderEditOverrideModal = () => (
        <Modal
            title="Chỉnh sửa Điều chỉnh Lịch học"
            visible={isEditOverrideModalVisible}
            onCancel={() => { setIsEditOverrideModalVisible(false); setEditingOverrideDetail(null); }}
            footer={[
                <Button key="back" onClick={() => { setIsEditOverrideModalVisible(false); setEditingOverrideDetail(null); }}>Hủy bỏ</Button>,
                // Chỉ hiển thị nút xóa nếu có overrideId hoặc nếu là buổi makeup_added được tạo từ frontend mà không có overrideId
                (editingOverrideDetail?.overrideId || editingOverrideDetail?.type === 'makeup_added' || editingOverrideDetail?.type === 'auto_makeup' || editingOverrideDetail?.type === 'rescheduled') && (
                    <Popconfirm
                        title={editingOverrideDetail?.overrideId ? "Xóa điều chỉnh này (hoàn tác nghỉ/thay đổi)?" : "Bạn có muốn hoàn tác buổi học bù này về trạng thái ban đầu không?"}
                        onConfirm={handleDeleteOverrideSubmit}
                        okText="Đồng ý Xóa" cancelText="Không"
                        disabled={isSubmittingOverride}
                    >
                        <Button key="delete" type="danger" loading={isSubmittingOverride} disabled={isSubmittingOverride}>
                            {editingOverrideDetail?.overrideId ? "Xóa Override" : "Hoàn tác"}
                        </Button>
                    </Popconfirm>
                ),
                <Button key="submit" type="primary" loading={isSubmittingOverride} onClick={handleUpdateOverrideSubmit}>
                    Lưu thay đổi
                </Button>,
            ]}
            destroyOnClose
        >
            {editingOverrideDetail && (
                <div>
                    <p><strong>Ngày đang sửa: {editingOverrideDetail.date.format('DD/MM/YYYY')}</strong> (Loại hiện tại: {editingOverrideDetail.type === 'auto_makeup' ? 'Buổi bù tự động' : (editingOverrideDetail.type === 'scheduled' ? 'Buổi học theo lịch' : editingOverrideDetail.type)})</p>
                    <div style={{ marginBottom: 12 }}>
                        <Text>Loại điều chỉnh: </Text>
                        <Select
                            value={editOverrideFormValues.type}
                            style={{ width: '100%' }}
                            onChange={(value) => setEditOverrideFormValues(prev => ({ ...prev, type: value, originalDate: null, newDate: null }))}
                        >
                            <Option value="cancelled">Hủy buổi (Cancelled)</Option>
                            <Option value="holiday">Ngày lễ (Holiday)</Option>
                            <Option value="rescheduled">Dời lịch (Rescheduled)</Option>
                            <Option value="makeup_added">Thêm buổi bù (Makeup Added)</Option>
                        </Select>
                    </div>

                    {(editOverrideFormValues.type === 'cancelled' || editOverrideFormValues.type === 'rescheduled') &&
                        <div style={{ marginBottom: 12 }}>
                            <Text>Ngày gốc (Original Date): </Text>
                            <DatePicker
                                value={editOverrideFormValues.originalDate}
                                onChange={date => setEditOverrideFormValues(prev => ({ ...prev, originalDate: date }))}
                                format="DD/MM/YYYY" style={{ width: '100%' }}
                                placeholder={editOverrideFormValues.type === 'cancelled' ? "Ngày bị hủy" : "Ngày dời TỪ"}
                            />
                        </div>
                    }
                    {editOverrideFormValues.type === 'holiday' &&
                        <div style={{ marginBottom: 12 }}>
                            <Text>Ngày lễ (Date): </Text>
                            <DatePicker
                                value={editOverrideFormValues.originalDate || editOverrideFormValues.newDate} // Holiday có thể chỉ có 1 ngày
                                onChange={date => setEditOverrideFormValues(prev => ({ ...prev, originalDate: date, newDate: date }))}
                                format="DD/MM/YYYY" style={{ width: '100%' }}
                                placeholder="Ngày lễ"
                            />
                        </div>
                    }

                    {(editOverrideFormValues.type === 'makeup_added' || editOverrideFormValues.type === 'rescheduled') &&
                        <div style={{ marginBottom: 12 }}>
                            <Text>Ngày mới (New Date): </Text>
                            <DatePicker
                                value={editOverrideFormValues.newDate}
                                onChange={date => setEditOverrideFormValues(prev => ({ ...prev, newDate: date }))}
                                format="DD/MM/YYYY" style={{ width: '100%' }}
                                placeholder={editOverrideFormValues.type === 'rescheduled' ? "Ngày dời TỚI" : "Ngày bù mới"}
                            />
                        </div>
                    }
                    <Input.TextArea
                        rows={3}
                        placeholder="Lý do điều chỉnh (không bắt buộc)"
                        value={editOverrideFormValues.reason}
                        onChange={e => setEditOverrideFormValues(prev => ({ ...prev, reason: e.target.value }))}
                    />
                </div>
            )}
        </Modal>
    );

    return (
        <div>
            {/* ... (Các phần hiển thị và nút "Lưu điểm danh" không thay đổi) */}
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                    <Text strong>Buổi học có thể dạy: {activeTeachingSessions}</Text>
                    {schedule?.totalSessions !== activeTeachingSessions &&
                        <Text style={{ marginLeft: '5px' }}>(Lịch gốc: {schedule?.totalSessions || 0} buổi)</Text>
                    }
                    <Text style={{ marginLeft: '15px' }}>Tổng sự kiện (gồm nghỉ/lễ): {sessionDatesAndDetails.length}</Text>
                </div>
                <Button
                    type="primary"
                    onClick={handleSaveAllChanges}
                    loading={isOverallLoading && Object.keys(attendanceRecords).length > 0}
                    disabled={!isOverallModified || (isOverallLoading && Object.keys(attendanceRecords).length > 0)}
                >
                    Lưu điểm danh
                </Button>
            </div>

            {(isOverallLoading && Object.keys(attendanceRecords).length > 0 && !overallError) && <Spin tip="Đang xử lý..." style={{ display: 'block', margin: '10px auto' }} />}

            {sessionDatesAndDetails.length > 0 && students.length > 0 && (
                <Table
                    columns={columns}
                    dataSource={filteredStudents.map(Student => ({ ...Student, key: Student._id }))}
                    bordered size="small" scroll={{ x: 'max-content' }}
                    pagination={{ pageSize: 20, hideOnSinglePage: true }}
                    rowKey="_id"
                />
            )}
            {filteredStudents.length === 0 && searchTextProp && !isOverallLoading && (
                <Alert message={`Không tìm thấy học sinh với từ khóa "${searchTextProp}".`} type="info" showIcon />
            )}
            {sessionDatesAndDetails.length === 0 && schedule && !isOverallLoading && (
                <Alert message="Không có buổi học nào từ lịch học và điều chỉnh." type="warning" showIcon />
            )}
            {renderEditOverrideModal()}
        </div>
    );
}

export default AttendanceManagement;