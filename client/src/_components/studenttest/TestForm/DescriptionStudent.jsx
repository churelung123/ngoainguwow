import React from 'react';
    import { Typography } from 'antd';
    import ReactQuill from 'react-quill';
    import 'react-quill/dist/quill.snow.css';

    const DescriptionStudent = ({ question }) => {
        return (
            <Typography.Paragraph>
                <ReactQuill
                    value={question.description}
                    readOnly={true}
                    theme={null}
                />
            </Typography.Paragraph>
        );
    };

    export default DescriptionStudent;