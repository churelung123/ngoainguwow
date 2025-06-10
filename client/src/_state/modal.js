import { atom } from 'recoil';

export const loginModalVisibleAtom = atom({
    key: 'loginModalVisibleState', // unique ID (globally unique)
    default: false, // Giá trị mặc định là ẩn
});