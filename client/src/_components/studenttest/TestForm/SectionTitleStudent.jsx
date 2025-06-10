import React from 'react';
import { Typography } from 'antd';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const SectionTitleStudent = ({ question }) => {
    return (
        <ReactQuill
            value={question.title}
            readOnly={true}
            theme={null}
        />
    );
};

export default SectionTitleStudent;