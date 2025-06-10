import { useRecoilState, useSetRecoilState, useResetRecoilState } from 'recoil';

import { useClassWrapper } from '_helpers';
import { authAtom, usersAtom, userAtom } from '_state';

export { useClassActions };

function useClassActions () {
    const classWrapper = useClassWrapper();
    const [auth, setAuth] = useRecoilState(authAtom);

    return {
        getClassList,
        setCurrentClass,
        getCurrentClass
    }

    async function getClassList() {
        console.log("Get class list called.");
        return classWrapper.getClassList();
    }

    async function setCurrentClass(cls){
        await classWrapper.chooseClass(cls);
    }

    async function getCurrentClass(cls){
        
        return JSON.parse(localStorage.getItem('currentClass'));
    }
}
