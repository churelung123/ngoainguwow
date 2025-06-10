import { useRecoilState } from 'recoil';
import { useFetchWrapper } from '_helpers';
import { useAlertActions, useStudentInfoAction, useStudentScoreAction } from '_actions';
import { classesAtom } from '_state';
import {currentClassAtom} from '_state'
export { useClassWrapper };

function useClassWrapper(param) {
    const fetchWrapper = useFetchWrapper();
    const alertActions = useAlertActions();
    const studentInfoAction = useStudentInfoAction();
    const studentScoreAction = useStudentScoreAction();
    const [classes, setClasses] = useRecoilState(classesAtom);
    const [curClass, setCurClass_] = useRecoilState(currentClassAtom);
    
    function setCurClass(cls) {
      setCurClass_(cls);
      localStorage.setItem("curClass", cls)
    }

    function chooseClass(cls) {
      setCurClass(cls);
      localStorage.setItem('currentClass', JSON.stringify(cls).toString());
      console.log("Choosen class :", cls)
      if (cls !== undefined) {
        studentInfoAction.getStudentList(cls);
        studentScoreAction.getScoreList(cls);
      } 
  }

    async function getCurrentClassTeacherInfo() {
      if (curClass) {
        let response = await fetchWrapper.get(`http://localhost:3000/api/classes/${curClass.class_id}?teacher=true`, null, null);
        response = await response.json();
        return response;
      }
    }

    return {
        classes : classes,
        curClass,
        getCurrentClassTeacherInfo:getCurrentClassTeacherInfo,
        chooseClass: chooseClass,
        setCurClass
    };
}



