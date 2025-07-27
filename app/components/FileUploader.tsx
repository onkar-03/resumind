import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploaderProps {
  onFileSelect?: (file: File | null) => void;
}

const FileUploader = ({ onFileSelect }: FileUploaderProps) => {
  const [file, setFile] = useState();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0] || null;

      onFileSelect?.(file);
    },
    [onFileSelect],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone();

  return (
    <div className='w-full gradient-border'>
      <div {...getRootProps()}>
        <input {...getInputProps()} />

        <div className='space-y-4 cursor-pointer'>
          <div className='mx-auto w-16 h-16 flex items-center justify-center'>
            <img src='/icons/info.svg' alt='info' className='size-20' />
          </div>

          {file ? (
            <div></div>
          ) : (
            <div>
              <div className='mx-auto w-16 h-16 flex items-center justify-center mb-2'>
                <img src='/icons/info.svg' alt='upload' className='size-20' />
              </div>
              <p className='text-lg text-gray-500'>
                <span className='font-semibold'>Click to upload</span> or drag
                and drop
              </p>
              <p className='text-lg text-gray-500'>PDF (max 20MB)</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default FileUploader;
