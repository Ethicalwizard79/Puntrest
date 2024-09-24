import React, { useEffect, useState, useCallback, useRef } from 'react';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, doc, deleteDoc, updateDoc, increment, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, firestore } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import '../css/home.css';

const PHOTOS_PER_PAGE = 10;

const PhotoCard = ({ photo, userEmail, onLike, onDislike, onDelete, deletingPhotoId }) => {
  const [userAction, setUserAction] = useState(
    photo.likedBy.includes(userEmail) ? 'liked' : 
    photo.dislikedBy.includes(userEmail) ? 'disliked' : null
  );

  const formatDate = (timestamp) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date();
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleLike = () => {
    if (userAction === 'liked') {
      setUserAction(null);
    } else {
      if (userAction === 'disliked') {
        setUserAction('liked');
        onDislike(photo.id); // Remove dislike
      } else {
        setUserAction('liked');
      }
      onLike(photo.id); // Add like
    }
  };

  const handleDislike = () => {
    if (userAction === 'disliked') {
      setUserAction(null);
    } else {
      if (userAction === 'liked') {
        setUserAction('disliked');
        onLike(photo.id); // Remove like
      } else {
        setUserAction('disliked');
      }
      onDislike(photo.id); // Add dislike
    }
  };

  const handleDownload = (e) => {
    e.preventDefault();
    const link = document.createElement('a');
    link.href = photo.imageUrl;
    link.download = `download_${photo.fileName || 'image'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="photo-card">
      <img src={photo.imageUrl} alt="Uploaded" loading="lazy" />
      <p className="uploader">Uploaded by: {photo.uploadedBy}</p>
      <p className="upload-date">Uploaded on: {formatDate(photo.timestamp)}</p>
      <div className="action-container">
        <button
          className={`action-btn ${userAction === 'liked' ? 'active' : ''}`}
          onClick={handleLike}
        >
          👍 <span>{photo.likes}</span>
        </button>
        <button
          className={`action-btn ${userAction === 'disliked' ? 'active' : ''}`}
          onClick={handleDislike}
        >
          👎 <span>{photo.dislikes}</span>
        </button>
        <button className="action-btn download-btn" onClick={handleDownload}>
          ⬇️ Download
        </button>
      </div>
      <p className="description">{photo.description || 'No description'}</p>
      {photo.uploadedBy === userEmail && (
        <button
          className="delete-btn"
          onClick={() => onDelete(photo.id, photo.fileName)}
          disabled={deletingPhotoId === photo.id}
        >
          {deletingPhotoId === photo.id ? 'Deleting...' : 'Delete'}
        </button>
      )}
    </div>
  );
};

export default function Home() {
  const [file, setFile] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState('');
  const [deletingPhotoId, setDeletingPhotoId] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(firestore, 'photos'), (snapshot) => {
      const updatedPhotos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPhotos(updatedPhotos); // Updates the photos state with real-time data
    });

    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email);
        setUserName(user.displayName || '');
      } else {
        window.location.href = '/';
      }
    });

    return () => {
      unsubscribe(); // Cleanup the listener on component unmount
      authUnsubscribe(); // Cleanup auth listener
    };
  }, []);

  const handleUpload = async () => {
    if (!file || uploading) return;
    setUploading(true);
    const storage = getStorage();
    const storageRef = ref(storage, `images/${auth.currentUser.uid}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log('Upload is ' + progress + '% done');
      },
      (error) => {
        console.error('Upload Error:', error);
        setUploading(false);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          await addDoc(collection(firestore, 'photos'), {
            imageUrl: downloadURL,
            uploadedBy: auth.currentUser.email,
            timestamp: serverTimestamp(),
            likes: 0,
            dislikes: 0,
            likedBy: [],
            dislikedBy: [],
            fileName: file.name,
            description: description,
          });
          setFile(null);
          setDescription('');
          setUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error) {
          console.error('Error uploading photo:', error);
          setUploading(false);
        }
      }
    );
  };

  const handleLikeDislike = async (photoId, action) => {
    try {
      const photoRef = doc(firestore, 'photos', photoId);
      const photoDoc = await photoRef.get();
      const photoData = photoDoc.data();
      const oppositeAction = action === 'liked' ? 'disliked' : 'liked';

      const isAlreadyActioned = photoData[`${action}By`].includes(userEmail);
      const isOppositeActioned = photoData[`${oppositeAction}By`].includes(userEmail);

      const updateData = {
        [`${action}By`]: isAlreadyActioned
          ? photoData[`${action}By`].filter(email => email !== userEmail)
          : [...photoData[`${action}By`], userEmail],
        [action]: increment(isAlreadyActioned ? -1 : 1),
      };

      if (isOppositeActioned) {
        updateData[`${oppositeAction}`] = increment(-1);
        updateData[`${oppositeAction}By`] = photoData[`${oppositeAction}By`].filter(email => email !== userEmail);
      }

      await updateDoc(photoRef, updateData);
    } catch (error) {
      console.error(`Error updating ${action}s:`, error);
    }
  };

  const handleDelete = async (photoId, fileName) => {
    const storage = getStorage();
    const storageRef = ref(storage, `images/${auth.currentUser.uid}/${fileName}`);
    setDeletingPhotoId(photoId);
    try {
      await deleteObject(storageRef);
      await deleteDoc(doc(firestore, 'photos', photoId));
    } catch (error) {
      console.error('Error deleting photo:', error);
    } finally {
      setDeletingPhotoId(null);
    }
  };

  const handleLogout = () => {
    signOut(auth).then(() => {
      window.location.href = '/';
    });
  };

  return (
    <div className="home-container">
      <header className="header">
        <h1>Welcome, {userName || 'User'}</h1>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <div className="upload-section">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
        />
                <input
          type="text"
          placeholder="Add a description (100 characters max)"
          maxLength={100}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button className="upload-btn" onClick={handleUpload} disabled={!file || uploading}>
          {uploading ? 'Uploading...' : 'Upload Photo'}
        </button>
      </div>

      <div className="photos-grid">
        {photos.map((photo) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            userEmail={userEmail}
            onLike={() => handleLikeDislike(photo.id, 'liked')}
            onDislike={() => handleLikeDislike(photo.id, 'disliked')}
            onDelete={handleDelete}
            deletingPhotoId={deletingPhotoId}
          />
        ))}
      </div>

      {photos.length === 0 && <p>No photos to display</p>}
    </div>
  );
}
