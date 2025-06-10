// src/components/CreatePostPage/CreatePostPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useFetchWrapper } from '_helpers';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useHistory } from 'react-router-dom';

export { CreatePostPage };

const CLOUDINARY_CLOUD_NAME = "dbdr1utn0"; // Thay YOUR_CLOUD_NAME bằng Cloud Name của bạn
const CLOUDINARY_UPLOAD_PRESET = "StudentManagement"; // Thay YOUR_UPLOAD_PRESET bằng tên Upload Preset bạn đã tạo

const CreatePostPage = () => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState(''); // Sẽ lưu URL ảnh từ Cloudinary
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    // const [uploadProgress, setUploadProgress] = useState(0); // Cloudinary API không dễ để lấy progress trực tiếp như Firebase với unsigned upload
    const [isUploading, setIsUploading] = useState(false);

    const [type, setType] = useState('Post');
    const [tags, setTags] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const imageInputRef = useRef(null);

    const history = useHistory();
    const fetchWrapper = useFetchWrapper();
    const quillRef = useRef(null);

    const uploadMediaToCloudinaryForEditor = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        // Sử dụng /auto/upload để Cloudinary tự phát hiện loại file
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
            { method: 'POST', body: formData }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `Lỗi HTTP khi tải media trong editor: ${response.status}`);
        }
        return response.json(); // Trả về toàn bộ data object từ Cloudinary
    };


    // Trình xử lý media tùy chỉnh cho Quill
    const customMediaHandler = () => {
        const editor = quillRef.current.getEditor();
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        // Cho phép chọn cả ảnh và video
        input.setAttribute('accept', 'image/*,video/*');
        input.click();

        input.onchange = async () => {
            const file = input.files[0];
            if (file) {
                const range = editor.getSelection(true); // Lưu lại vị trí con trỏ trước khi tải
                // Tùy chọn: Hiển thị thông báo đang tải trong editor
                editor.insertText(range.index, `\n[Đang tải ${file.name}...]\n`, { color: 'gray', italic: true });
                editor.setSelection(range.index + `\n[Đang tải ${file.name}...]\n`.length, 0);


                try {
                    console.log(`Đang tải ${file.type} trong editor lên Cloudinary...`);
                    const cloudinaryData = await uploadMediaToCloudinaryForEditor(file);
                    const mediaUrl = cloudinaryData.secure_url;
                    const resourceType = cloudinaryData.resource_type; // 'image' hoặc 'video'

                    // Xóa thông báo đang tải (nếu có)
                    // Việc này hơi phức tạp vì cần tìm đúng text node và xóa nó.
                    // Một cách đơn giản hơn là không hiển thị text loading hoặc chấp nhận nó vẫn còn đó
                    // và người dùng có thể xóa thủ công. Hoặc bạn có thể dùng một placeholder ID.
                    // Ví dụ đơn giản: editor.deleteText(range.index, `\n[Đang tải ${file.name}...]\n`.length);
                    // Cần cẩn thận với việc thay đổi độ dài nội dung khi xóa.

                    // Chèn media vào editor dựa trên loại
                    if (resourceType === 'image') {
                        editor.insertEmbed(range.index, 'image', mediaUrl);
                    } else if (resourceType === 'video') {
                        // Quill mặc định có thể không có trình xử lý video tốt như ảnh.
                        // Việc chèn video có thể cần bạn định nghĩa một "VideoBlot" tùy chỉnh
                        // hoặc chèn dưới dạng HTML (nếu Quill cho phép).
                        // Cách đơn giản nhất là chèn ảnh đại diện của video và link tới video,
                        // hoặc nếu editor hỗ trợ thẻ video trực tiếp:
                        editor.insertEmbed(range.index, 'video', mediaUrl);
                        // Nếu 'video' blot không được hỗ trợ tốt, bạn có thể cần phải
                        // tự tạo HTML cho thẻ video và dùng editor.clipboard.dangerouslyPasteHTML(range.index, videoHTML);
                        // Ví dụ: const videoHTML = `<video controls src="${mediaUrl}" width="100%"></video><p></p>`;
                        // editor.clipboard.dangerouslyPasteHTML(range.index, videoHTML);
                    }
                    editor.setSelection(range.index + 1, 0); // Di chuyển con trỏ sau media

                } catch (error) {
                    console.error("Lỗi khi tải media từ Quill editor lên Cloudinary:", error);
                    editor.insertText(range.index, `\n[Lỗi tải ${file.name}: ${error.message}]\n`, { color: 'red' });
                    // Xóa thông báo đang tải nếu nó vẫn còn
                    // editor.deleteText(range.index, `\n[Đang tải ${file.name}...]\n`.length);
                }
            }
        };
    };


    useEffect(() => {
        if (quillRef.current) {
            const editor = quillRef.current.getEditor();
            const toolbar = editor.getModule('toolbar');

            // Ghi đè trình xử lý cho nút 'image' trên toolbar
            // Nếu toolbar của bạn có nút 'video' riêng, bạn cũng cần ghi đè nó
            // và có thể gọi cùng một customMediaHandler hoặc một handler riêng biệt.
            toolbar.addHandler('image', customMediaHandler);
            // toolbar.addHandler('video', customMediaHandler); // Nếu có nút video riêng
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [quillRef.current]); // Chạy lại nếu quillRef thay đổi (mặc dù thường chỉ một lần)


    const modules = {
        toolbar: [
            [{ 'header': '1' }, { 'header': '2' }, { 'font': [] }],
            [{ size: [] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' },
            { 'indent': '-1' }, { 'indent': '+1' }],
            ['link', 'image', 'video'],
            ['clean'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'align': [] }],
        ],
    };

    const formats = [
        'header', 'font', 'size',
        'bold', 'italic', 'underline', 'strike', 'blockquote',
        'list', 'bullet', 'indent',
        'link', 'image', 'video',
        'color', 'background', 'align'
    ];

    const handleImageFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) { // Giới hạn 5MB ví dụ
                setError("Kích thước ảnh không được vượt quá 5MB.");
                setImageFile(null); // Xóa file nếu quá lớn
                setImagePreview('');
                if (imageInputRef.current) { // Reset input file
                    imageInputRef.current.value = "";
                }
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setError("Kích thước ảnh không được vượt quá 5MB.");
                setImageFile(null);
                setImagePreview('');
                if (imageInputRef.current) { // Reset input file
                    imageInputRef.current.value = "";
                }
                return;
            }
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            setImageUrl(''); // Reset imageUrl đã upload trước đó
            setError(null);
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview('');
        setImageUrl(''); // Quan trọng: Xóa cả URL đã upload nếu có
        setError(null); // Xóa thông báo lỗi nếu có
        if (imageInputRef.current) {
            imageInputRef.current.value = ""; // Reset giá trị của input file
        }
    };

    const handleImageUploadToCloudinary = async () => {
        if (!imageFile) {
            setError("Vui lòng chọn một file ảnh trước khi upload.");
            return;
        }
        if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
            setError("Thông tin cấu hình Cloudinary bị thiếu. Vui lòng kiểm tra lại code.");
            console.error("Cloudinary cloud name or upload preset is not defined.");
            return;
        }

        setIsUploading(true);
        setError(null);
        // setUploadProgress(0); // Bỏ progress vì khó lấy với unsigned upload đơn giản

        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        // Bạn có thể thêm các thông số khác như public_id, tags, v.v.
        // formData.append('public_id', `my_app_images/${Date.now()}_${imageFile.name}`);

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
                {
                    method: 'POST',
                    body: formData,
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `Lỗi HTTP: ${response.status}`);
            }

            const data = await response.json();
            setImageUrl(data.secure_url); // Hoặc data.url nếu không cần HTTPS
            setIsUploading(false);
            console.log('Ảnh đã upload lên Cloudinary:', data.secure_url);
            // Không xóa imageFile và imagePreview để người dùng biết họ đã upload ảnh nào

        } catch (uploadError) {
            console.error("Cloudinary upload error:", uploadError);
            setError(`Lỗi upload ảnh: ${uploadError.message}`);
            setIsUploading(false);
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title.trim() || !content.trim() || !type) {
            setError('Tiêu đề, nội dung và loại bài viết không được để trống.');
            return;
        }
        // Kiểm tra xem ảnh đã được chọn nhưng chưa upload (nếu người dùng muốn có ảnh)
        // Nếu imageUrl rỗng VÀ imageFile có tồn tại (tức là người dùng đã chọn file mới)
        // VÀ không đang trong quá trình uploading
        if (!imageUrl && imageFile && !isUploading) {
            setError('Bạn đã chọn ảnh mới nhưng chưa nhấn "Upload ảnh này". Vui lòng upload hoặc bỏ chọn file.');
            return;
        }
        if (isUploading) {
            setError('Ảnh đại diện đang được upload, vui lòng đợi.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccessMessage('');

        const postData = {
            title: title.trim(),
            content: content,
            imageUrl: imageUrl, // URL từ Cloudinary (có thể rỗng nếu không có ảnh)
            type,
            tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
        };


        try {
            const responseData = await fetchWrapper.post(
                "/api/posts", // Endpoint backend của bạn
                'application/json', // Đảm bảo backend của bạn chấp nhận kiểu này
                postData
            );

            console.log(responseData.status);

            if (responseData.status === 201) {
                setSuccessMessage('Bài viết đã được tạo thành công!');
                setTitle(''); setContent(''); setImageUrl(''); setImageFile(null);
                setImagePreview(''); setType('Post'); setTags('');
                setTimeout(() => {
                    if (responseData.result && responseData.result._id) {
                        history.push(`/posts/${responseData.result._id}`);
                    } else {
                        history.push('/');
                    }
                }, 1500);
            } else {
                setError(responseData?.message || 'Có lỗi xảy ra khi tạo bài viết.');
            }
        } catch (err) {
            console.error("Lỗi khi submit bài viết:", err);
            setError(err.message || 'Lỗi không xác định khi gửi bài viết.');
        } finally {
            setIsLoading(false);
        }
    };

    // STYLES (Trong CreatePostPage.jsx)

    const pageStyle = {
        maxWidth: '100%', // Tăng chiều rộng trang để có không gian cho bố cục mới
        margin: '20px auto',
        padding: '20px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        boxShadow: '0 0 10px rgba(0,0,0,0.1)',
    };

    const formRowStyle = { // Style cho mỗi hàng chính trong form (ví dụ: hàng chứa input và upload)
        display: 'flex',
        flexWrap: 'wrap', // Cho phép các item xuống hàng trên màn hình nhỏ
        gap: '20px',      // Khoảng cách giữa các item con (ví dụ: cột trái và cột phải)
        marginBottom: '20px', // Khoảng cách với hàng tiếp theo (ví dụ: hàng của ReactQuill)
    };

    const formGroupStyle = { // Style chung cho mỗi nhóm label + input
        display: 'flex',
        flexDirection: 'column', // Label ở trên, input ở dưới
        flex: '1', // Mặc định các group sẽ cố gắng chia đều không gian trong container cha của chúng
        // Nếu một formGroupStyle nằm một mình trong một div cha, nó sẽ chiếm toàn bộ chiều rộng.
    };

    const shortFormGroupStyle = { // Style cho các nhóm input ngắn hơn như "Loại bài viết", "Tags"
        ...formGroupStyle, // Kế thừa từ formGroupStyle
        flex: '1',         // Đảm bảo chúng có thể chia sẻ không gian đều nhau khi đặt cạnh nhau
        minWidth: '150px', // Chiều rộng tối thiểu để không bị quá hẹp
    };

    const imageUploadSectionStyle = { // Style cho toàn bộ khu vực upload ảnh (cột phải)
        flex: '2', // Tỷ lệ không gian nó chiếm so với các item khác trong cùng formRowStyle.
        // Bạn có thể điều chỉnh giá trị này. Ví dụ, nếu cột trái (chứa Tiêu đề, Loại, Tag)
        // có tổng flex là 3, thì flex: 2 ở đây sẽ làm cột upload chiếm 2/5 tổng không gian.
        minWidth: '280px', // Chiều rộng tối thiểu cho khu vực upload
        display: 'flex',
        flexDirection: 'column', // Các phần tử con (label, preview, input, button) xếp chồng lên nhau
        gap: '10px', // Khoảng cách giữa các phần tử con bên trong khu vực upload
    };

    const imagePreviewContainerStyle = { // Style cho khung chứa ảnh xem trước
        border: '2px dashed #ccc',
        borderRadius: '8px',
        padding: '10px',
        minHeight: '150px', // Chiều cao tối thiểu cho khung, đảm bảo nó có kích thước ngay cả khi chưa có ảnh
        display: 'flex',
        justifyContent: 'center', // Căn giữa ảnh xem trước theo chiều ngang
        alignItems: 'center',   // Căn giữa ảnh xem trước theo chiều dọc
        backgroundColor: '#f9f9f9', // Màu nền nhẹ cho khung
        width: '100%', // Chiếm toàn bộ chiều rộng của imageUploadSectionStyle
        overflow: 'hidden', // Ngăn ảnh xem trước tràn ra ngoài nếu kích thước lớn
    };

    const imagePreviewStyle = { // Style cho chính thẻ <img> xem trước
        maxWidth: '100%',    // Đảm bảo ảnh không rộng hơn container của nó
        maxHeight: '200px',  // Giới hạn chiều cao tối đa của ảnh xem trước
        objectFit: 'contain', // 'contain' sẽ đảm bảo toàn bộ ảnh được hiển thị, có thể để lại khoảng trống.
        // 'cover' sẽ lấp đầy khung, có thể cắt bớt ảnh.
        borderRadius: '4px',  // Bo góc nhẹ cho ảnh xem trước
    };

    const labelStyle = { // Style cho các nhãn (label)
        display: 'block', // Để nó chiếm một dòng riêng
        marginBottom: '5px', // Khoảng cách với input bên dưới
        fontWeight: 'bold',
        fontSize: '0.9rem', // Kích thước chữ cho label
    };

    const inputStyle = { // Style chung cho các trường input text, select
        width: '100%', // Chiếm toàn bộ chiều rộng của formGroupStyle cha
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxSizing: 'border-box', // Quan trọng để padding và border không làm tăng kích thước tổng thể
        fontSize: '1rem',
    };

    const buttonStyle = { // Style cho nút "Đăng bài viết"
        padding: '10px 20px',
        backgroundColor: '#007bff', // Màu xanh dương
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px',
    };

    const actionButtonsContainerStyle = {
        display: 'flex',
        gap: '10px', // Khoảng cách giữa hai nút
        width: '100%', // Chiếm toàn bộ chiều rộng của imageUploadSectionStyle
    };

    const uploadButtonStyle = { // Style cho nút "Upload ảnh này"
        ...buttonStyle, // Kế thừa từ buttonStyle
        backgroundColor: '#17a2b8',
        fontSize: '0.9em',
        padding: '8px 12px',
        flex: '1',
    };

    const removeButtonStyle = { // Style cho nút xóa ảnh
        ...buttonStyle,
        backgroundColor: '#dc3545', // Màu đỏ cảnh báo
        fontSize: '0.9em',
        padding: '8px 12px',
        flex: '1',
    };


    const quillEditorStyle = { // Style cho trình soạn thảo ReactQuill
        height: '300px', // Chiều cao ban đầu của editor
        marginBottom: '50px', // Để có không gian cho toolbar không bị che và khoảng cách với nút submit
    };

    return (
        <div style={pageStyle}>
            <h2>Tạo bài viết mới</h2>
            <form onSubmit={handleSubmit}>
                {/* Hàng 1: Tiêu đề và Khu vực upload ảnh */}
                <div style={formRowStyle}>
                    {/* Cột trái: Tiêu đề, Loại, Tag */}
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 2, gap: '20px' }}>
                        <div style={formGroupStyle}>
                            <label htmlFor="title" style={labelStyle}>Tiêu đề:</label>
                            <textarea id="title" rows={4} value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} required />
                        </div>
                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                            <div style={shortFormGroupStyle}>
                                <label htmlFor="type" style={labelStyle}>Loại bài viết:</label>
                                <select id="type" value={type} onChange={(e) => setType(e.target.value)} style={inputStyle} required >
                                    <option value="Post">Tin tức (Post)</option>
                                    <option value="Course">Khóa học (Course)</option>
                                </select>
                            </div>
                            <div style={shortFormGroupStyle}>
                                <label htmlFor="tags" style={labelStyle}>Tags (cách bằng dấu phẩy):</label>
                                <input type="text" id="tags" value={tags} onChange={(e) => setTags(e.target.value)} style={inputStyle} placeholder="Ví dụ: react, web" />
                            </div>
                        </div>
                    </div>

                    {/* Cột phải: Khu vực upload ảnh */}
                    <div style={imageUploadSectionStyle}>
                        <label htmlFor="imageUpload" style={labelStyle}>Ảnh thumbnail:</label>
                        <div style={imagePreviewContainerStyle}>
                            {!imagePreview && <p style={{ color: '#888', fontSize: '0.9rem' }}>Xem trước ảnh</p>}
                            {imagePreview && (
                                <img src={imagePreview} alt="Xem trước" style={imagePreviewStyle} />
                            )}
                        </div>
                        <input
                            type="file"
                            id="imageUpload"
                            accept="image/*"
                            onChange={handleImageFileChange}
                            ref={imageInputRef} // Gán ref cho input file
                            style={{ ...inputStyle, padding: '8px', fontSize: '0.9rem' }}
                        />

                        {/* Chỉ hiển thị các nút action khi có ảnh xem trước hoặc file đã chọn */}
                        {(imagePreview || imageFile) && (
                            <div style={actionButtonsContainerStyle}>
                                {imageFile && !imageUrl && ( // Chỉ hiển thị nút upload nếu có file mới và chưa có URL đã upload
                                    <button
                                        type="button"
                                        onClick={handleImageUploadToCloudinary}
                                        disabled={isUploading}
                                        style={uploadButtonStyle}
                                    >
                                        {isUploading ? `Đang tải...` : 'Upload ảnh này'}
                                    </button>
                                )}
                                {imageUrl && !isUploading && ( // Nếu đã có URL (ảnh đã upload)
                                    <button // Nút upload lại
                                        type="button"
                                        onClick={handleImageUploadToCloudinary}
                                        disabled={isUploading || !imageFile} // Disable nếu đang upload hoặc không có file mới để upload lại
                                        style={uploadButtonStyle}
                                    >
                                        {isUploading ? `Đang tải...` : (imageFile ? 'Upload lại ảnh mới?' : 'Đã upload')}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    style={removeButtonStyle}
                                    disabled={isUploading} // Không cho xóa khi đang upload
                                >
                                    Xóa ảnh
                                </button>
                            </div>
                        )}

                        {imageUrl && !isUploading && !imageFile && ( // Hiển thị khi đã upload và không có file mới nào được chọn
                            <p style={{ color: 'green', marginTop: '5px', fontSize: '0.9rem' }}>
                                ✓ Ảnh đã sẵn sàng: <a href={imageUrl} target="_blank" rel="noopener noreferrer">Xem ảnh</a>
                            </p>
                        )}
                    </div>
                </div>

                {/* Hàng 2: ReactQuill Editor */}
                <div style={formGroupStyle}>
                    <label style={labelStyle}>Nội dung bài viết:</label>
                    <ReactQuill ref={quillRef} theme="snow" value={content} onChange={setContent} modules={modules} formats={formats} placeholder="Nhập nội dung bài viết ở đây..." style={quillEditorStyle} />
                </div>

                {error && <p style={{ color: 'red', marginTop: '10px' }}>Lỗi: {error}</p>}
                {successMessage && <p style={{ color: 'green', marginTop: '10px' }}>{successMessage}</p>}

                <button type="submit" disabled={isLoading || isUploading} style={{ ...buttonStyle, marginTop: '20px' }}>
                    {isLoading ? 'Đang lưu bài viết...' : 'Đăng bài viết'}
                </button>
            </form>
        </div>
    );
};

// export default CreatePostPage;

export default CreatePostPage; 