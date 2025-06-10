import 'antd/dist/antd.css';
import { useRecoilState, useRecoilValue } from 'recoil';

import { studentsAtom } from '_state';
import { StudentInfoTable } from '_components/studentInfoList';

export { StudentInfoList };

function StudentInfoList() {

    const [Student, setstudent] = useRecoilState(studentsAtom);
    return (
        <div className="p-4">
            
            <StudentInfoTable data={Student}/>
        </div>
    );
}