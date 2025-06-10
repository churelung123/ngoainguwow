import { atom } from 'recoil';

// Đảm bảo các atom hiện có của bạn vẫn ở đây
export const authAtom = atom({
    key: 'auth',
    default: null
});

export const classPickerVisibleAtom = atom({
    key: 'classPickerVisible',
    default: false
});

export const loadingVisibleAtom = atom({
    key: 'loadingVisible',
    default: false
});

// THÊM ĐỊNH NGHĨA isTakingTestAtom NÀY VÀO TỆP CỦA BẠN
export const isTakingTestAtom = atom({
    key: 'isTakingTestAtom', // key duy nhất cho atom
    default: false,          // Giá trị mặc định là false (không đang làm bài kiểm tra)
});