import ResumeCard from '~/components/ResumeCard';
import type { Route } from './+types/home';
import Navbar from '~/components/Navbar';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { usePuterStore } from '~/lib/puter';
import { parse } from 'path';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Resumind' },
    { name: 'description', content: 'Smart feedback for your dream job!' },
  ];
}

export default function Home() {
  // We use the Puter store to access authentication and key-value store
  const { auth, kv } = usePuterStore();

  // Use React Router hooks to manage navigation and location
  const navigate = useNavigate();

  // State to hold resumes and loading state
  const [resumes, setResumes] = useState<Resume[]>([]);

  // State to manage loading state for resumes
  const [loadingResumes, setLoadingResumes] = useState(false);

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!auth.isAuthenticated) navigate('/auth?next=/');
  }, [auth.isAuthenticated]);

  // Load resumes from the key-value store when the component mounts
  useEffect(() => {
    const loadResumes = async () => {
      setLoadingResumes(true);

      const resumes = (await kv.list('resume:*', true)) as KVItem[];

      const parsedResumes = resumes?.map(
        (resume) => JSON.parse(resume.value) as Resume,
      );

      // Log the parsed resumes for debugging
      // console.log('Parsed Resumes:', parsedResumes);

      // Set the resumes state with the parsed resumes
      setResumes(parsedResumes || []);

      // Set loading state to false after fetching resumes
      setLoadingResumes(false);
    };

    // Call the loadResumes function to fetch resumes
    loadResumes();
  }, []);

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />

      <section className='main-section'>
        <div className='page-heading py-16'>
          <h1>Track Your Applications & Resume Ratings</h1>
          {!loadingResumes && resumes?.length === 0 ? (
            <h2>No resumes found. Upload your first resume to get feedback.</h2>
          ) : (
            <h2>Review your submissions and check AI-powered feedback.</h2>
          )}
        </div>
        {loadingResumes && (
          <div className='flex flex-col items-center justify-center'>
            <img src='/images/resume-scan-2.gif' className='w-[200px]' />
          </div>
        )}

        {!loadingResumes && resumes.length > 0 && (
          <div className='resumes-section'>
            {resumes.map((resume) => (
              <ResumeCard key={resume.id} resume={resume} />
            ))}
          </div>
        )}

        {!loadingResumes && resumes?.length === 0 && (
          <div className='flex flex-col items-center justify-center mt-10 gap-4'>
            <Link
              to='/upload'
              className='primary-button w-fit text-xl font-semibold'
            >
              Upload Resume
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
