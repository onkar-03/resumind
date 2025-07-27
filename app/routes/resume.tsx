import { Link, useNavigate, useParams } from 'react-router';
import { useEffect, useState } from 'react';
import { usePuterStore } from '~/lib/puter';

export const meta = () => [
  { title: 'Resumind | Review ' },
  { name: 'description', content: 'Detailed overview of your resume' },
];

const Resume = () => {
  const { auth, isLoading, fs, kv } = usePuterStore();
  const { id } = useParams();
  const [imageUrl, setImageUrl] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const navigate = useNavigate();

  // Redirect to auth page if user is not authenticated
  useEffect(() => {
    // If user is not authenticated and isLoading is false, redirect to auth page
    if (!isLoading && !auth.isAuthenticated)
      navigate(`/auth?next=/resume/${id}`);
  }, [isLoading]);

  // Load resume data from kv store
  useEffect(() => {
    // Check if id is valid
    const loadResume = async () => {
      const resume = await kv.get(`resume:${id}`);

      // If no resume data found, redirect to upload page
      if (!resume) return;

      // Parse the resume data
      const data = JSON.parse(resume);

      //
      const resumeBlob = await fs.read(data.resumePath);
      if (!resumeBlob) return;

      // Create a URL for the resume PDF and image
      // Files from cloud are returned as Blob objects
      const pdfBlob = new Blob([resumeBlob], { type: 'application/pdf' });
      const resumeUrl = URL.createObjectURL(pdfBlob);
      setResumeUrl(resumeUrl);

      // Create a URL for the resume image
      const imageBlob = await fs.read(data.imagePath);
      if (!imageBlob) return;
      const imageUrl = URL.createObjectURL(imageBlob);
      setImageUrl(imageUrl);

      // Set the feedback data
      setFeedback(data.feedback);

      // Log the resume and image URLs along with feedback
      console.log({ resumeUrl, imageUrl, feedback: data.feedback });
    };

    // If id is not provided, redirect to upload page
    loadResume();
  }, [id]);

  return (
    <main className='!pt-0'>
      <nav className='resume-nav'>
        <Link to='/' className='back-button'>
          <img src='/icons/back.svg' alt='logo' className='w-2.5 h-2.5' />
          <span className='text-gray-800 text-sm font-semibold'>
            Back to Homepage
          </span>
        </Link>
      </nav>
      <div className='flex flex-row w-full max-lg:flex-col-reverse'>
        <section className="feedback-section bg-[url('/images/bg-small.svg') bg-cover h-[100vh] sticky top-0 items-center justify-center">
          {imageUrl && resumeUrl && (
            <div className='animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-[90%] max-wxl:h-fit w-fit'>
              <a href={resumeUrl} target='_blank' rel='noopener noreferrer'>
                <img
                  src={imageUrl}
                  className='w-full h-full object-contain rounded-2xl'
                  title='resume'
                />
              </a>
            </div>
          )}
        </section>
        <section className='feedback-section'>
          <h2 className='text-4xl !text-black font-bold'>Resume Review</h2>
          {feedback ? (
            <div className='flex flex-col gap-8 animate-in fade-in duration-1000'>
              <div>Summary</div> <div>ATS</div> <div>Details</div>
            </div>
          ) : (
            <img src='/images/resume-scan-2.gif' className='w-full' />
          )}
        </section>
      </div>
    </main>
  );
};
export default Resume;
