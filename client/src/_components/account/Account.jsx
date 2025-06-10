import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Button } from 'antd';
import { useUserActions } from '_actions/user.actions'; // Import hook useUserActions
import { useRecoilValue } from 'recoil';
import { authAtom, initClassAtom } from '_state';

const Account = ({ visible, onClose, history }) => {
    const auth = useRecoilValue(authAtom);
    const classPicked = useRecoilValue(initClassAtom);
    const [form] = Form.useForm();
    const userActions = useUserActions(); // Gọi hook ở đây, bên ngoài onFinish

    useEffect(() => {
        if (auth) {
            onClose();
            history.push('/');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auth, history, onClose]);

    const onFinish = (values) => {
        userActions.login(values); // Sử dụng hàm login từ userActions
    };

    const onFinishFailed = (errorInfo) => {
        console.log('Failed:', errorInfo);
    };

    return (
        <Modal
            title="Đăng nhập"
            visible={visible}
            onCancel={onClose}
            footer={null}
        >
            <div className="container">
                <div className="row">
                    <div className="col-sm-12">
                        <Form
                            form={form}
                            name="login-form"
                            initialValues={{ remember: true }}
                            onFinish={onFinish}
                            onFinishFailed={onFinishFailed}
                            autoComplete="off"
                        >
                            <Form.Item
                                label="Tên đăng nhập"
                                name="username"
                                rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
                                labelCol={{ span: 24 }} // Nhãn chiếm toàn bộ chiều rộng cột
                                wrapperCol={{ span: 24 }} // Wrapper chiếm toàn bộ chiều rộng cột
                            >
                                <Input />
                            </Form.Item>

                            <Form.Item
                                label="Mật khẩu"
                                name="password"
                                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                                labelCol={{ span: 24 }}
                                wrapperCol={{ span: 24 }}
                            >
                                <Input.Password />
                            </Form.Item>

                            <Form.Item>
                                <Button type="primary" htmlType="submit">
                                    Đăng nhập
                                </Button>
                                {/* Bạn có thể thêm link khôi phục mật khẩu ở đây nếu cần */}
                            </Form.Item>
                        </Form>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export { Account };