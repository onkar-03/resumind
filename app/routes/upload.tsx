import { type FormEvent, useState } from 'react';
import Navbar from '~/components/Navbar';
import { usePuterStore } from '~/lib/puter';
import { useNavigate } from 'react-router';
import FileUploader from '~/components/FileUploader';
import { convertPdfToImage } from '~/lib/pdf2img';
import { generateUUID } from '~/lib/utils';
import { prepareInstructions } from '../../constants';

const Upload = () => {
  const { auth, isLoading, fs, ai, kv } = usePuterStore();
  const navigate = useNavigate();

  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleFileSelect = (file: File | null) => {
    setFile(file);
  };

  const handleAnalyze = async ({
    companyName,
    jobTitle,
    jobDescription,
    file,
  }: {
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    file: File;
  }) => {
    setIsProcessing(true);

    setStatusText('Uploading the file...');

    const uploadedFile = await fs.upload([file]);

    // Check if the file was not uploaded successfully
    if (!uploadedFile) return setStatusText('Error: Failed to upload file');

    // Otherwise if file upload was successful display converting to image
    setStatusText('Converting to image...');

    // Convert PDF to image
    const imageFile = await convertPdfToImage(file);

    // Check if the image file was not created successfully
    if (!imageFile.file)
      return setStatusText('Error: Failed to convert PDF to image');

    // Otherwise if image file was created successfully display uploading image
    setStatusText('Uploading the image...');

    // Upload the image file
    const uploadedImage = await fs.upload([imageFile.file]);

    // Check if the image was not uploaded successfully
    if (!uploadedImage) return setStatusText('Error: Failed to upload image');

    // Otherwise if image upload was successful display preparing data
    setStatusText('Preparing data...');

    // Generate a unique ID for the resume
    const uuid = generateUUID();
    const data = {
      id: uuid,
      resumePath: uploadedFile.path,
      imagePath: uploadedImage.path,
      companyName,
      jobTitle,
      jobDescription,
      feedback: '',
    };

    // Save the resume data to the database
    await kv.set(`resume:${uuid}`, JSON.stringify(data));

    // Otherwise if data preparation was successful display analyzing resume
    setStatusText('Analyzing...');

    // Call the AI service to analyze the resume
    const feedback = await ai.feedback(
      uploadedFile.path,
      prepareInstructions({ jobTitle, jobDescription }),
    );

    // Check if the feedback was not received successfully and give error message
    if (!feedback) return setStatusText('Error: Failed to analyze resume');

    // If feedback is not a string, parse it
    const feedbackText =
      typeof feedback.message.content === 'string'
        ? feedback.message.content
        : feedback.message.content[0].text;

    // Parse the feedback and save it to the database
    data.feedback = JSON.parse(feedbackText);

    // Save the feedback to the database
    await kv.set(`resume:${uuid}`, JSON.stringify(data));
    setStatusText('Analysis complete, redirecting...');
    console.log(data);

    // Redirect to the resume page
    navigate(`/resume/${uuid}`);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Check if the user is authenticated
    const form = e.currentTarget.closest('form');

    //  f the user is not authenticated, redirect to login
    if (!form) return;

    // If the user is authenticated, proceed with form submission
    const formData = new FormData(form);

    // Get form values
    const companyName = formData.get('company-name') as string;
    const jobTitle = formData.get('job-title') as string;
    const jobDescription = formData.get('job-description') as string;

    // Log the form data for debugging
    console.log('Form Data:', {
      companyName,
      jobTitle,
      jobDescription,
      file,
    });

    // Check if the file is selected
    if (!file) return;

    // If the file is selected, proceed with analysis
    handleAnalyze({ companyName, jobTitle, jobDescription, file });
  };

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />

      <section className='main-section'>
        <div className='page-heading py-16'>
          <h1>Smart feedback for your dream job</h1>
          {isProcessing ? (
            <>
              <h2>{statusText}</h2>
              <img src='/images/resume-scan.gif' className='w-full' />
            </>
          ) : (
            <h2>Drop your resume for an ATS score and improvement tips</h2>
          )}
          {!isProcessing && (
            <form
              id='upload-form'
              onSubmit={handleSubmit}
              className='flex flex-col gap-4 mt-8'
            >
              <div className='form-div'>
                <label htmlFor='company-name'>Company Name</label>
                <input
                  type='text'
                  name='company-name'
                  placeholder='Company Name'
                  id='company-name'
                />
              </div>
              <div className='form-div'>
                <label htmlFor='job-title'>Job Title</label>
                <input
                  type='text'
                  name='job-title'
                  placeholder='Job Title'
                  id='job-title'
                />
              </div>
              <div className='form-div'>
                <label htmlFor='job-description'>Job Description</label>
                <textarea
                  rows={5}
                  name='job-description'
                  placeholder='Job Description'
                  id='job-description'
                />
              </div>

              <div className='form-div'>
                <label htmlFor='uploader'>Upload Resume</label>
                <FileUploader onFileSelect={handleFileSelect} />
              </div>

              <button className='primary-button' type='submit'>
                Analyze Resume
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
};
export default Upload;
