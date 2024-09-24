import React, { useState } from 'react';
import SignUp from '../components/signup';
import Login from '../components/login';
import { useNavigate } from 'react-router-dom'; 
import '../css/signuplogin.css';

export default function SignUpLogin() {
  const [isSignUp, setIsSignUp] = useState(true);
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    navigate('/home'); // Navigate to home page after successful login/signup
  };

  return (
    <div className='container'>
      <div className='heading'>LETS GET STARTED.. BUDDY✨</div>
      {isSignUp ? (
        <SignUp onLogin={handleLoginSuccess} />
      ) : (
        <Login onLogin={handleLoginSuccess} />
      )}
      <p>
        {isSignUp ? (
          <>
            Already have an Account?{' '}
            <span onClick={() => setIsSignUp(false)} style={{ cursor: 'pointer', color: 'purple' }}>
              Let's Move to Login Page
            </span>
          </>
        ) : (
          <>
            Not having an Account?{' '}
            <span onClick={() => setIsSignUp(true)} style={{ cursor: 'pointer', color: 'purple' }}>
              Alright, Let's Create One
            </span>
          </>
        )}
      </p>
    </div>
  );
}
