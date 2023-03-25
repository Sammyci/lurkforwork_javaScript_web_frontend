import { BACKEND_PORT } from './config.js';
import { fileToDataUrl } from './helpers.js';
let myuserId;
const apiCall = (path, method, body) => {
  return new Promise((resolve, reject) => {
    const options = {
      method: method,
      headers: {
        'Content-type': 'application/json',
      },
    };
    if (method === 'GET') {
    } else {
      options.body = JSON.stringify(body);
    }
    if (localStorage.getItem('token')) {
      options.headers.Authorization = `Bearer ${localStorage.getItem('token')}`;
    }

    fetch('http://localhost:5005/' + path, options)
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          displayError(data.error); // Display of error messages
        } else {
          resolve(data);
        }
      })
      .catch((error) => {
        displayError(error); // Display of generic error messages
      });
  });
};

function createCommentsList(comments) {
  const commentsList = document.createElement('ul');
  commentsList.className = 'comments-list';

  comments.forEach((comment) => {
    const commentElement = document.createElement('li');
    const commentUserName = document.createElement('a' );
    commentUserName.href = '#';
    console.log('names:',comment.userName);
    commentUserName.textContent = comment.userName;
    const commentText = document.createTextNode(` (${comment.userEmail}): ${comment.comment}`);
    commentUserName.addEventListener("click", function() {
        document.getElementById("feed-data-page").classList.add("hide");
        document.getElementById("profile").classList.add("hide");
        document.getElementById("post").classList.add("hide");
        document.getElementById("user-profile").classList.remove("hide");
        if (comment.userId) {
          makeuserProfile(comment.userId);
        } else {
          displayError('User ID not found.');
        }
    });
    commentElement.appendChild(commentUserName);
    commentElement.appendChild(commentText);
    commentsList.appendChild(commentElement);
  });
  return commentsList;
}

function toggleCommentsList(comments, feedItemElement, commentsListContainer,endpointValue) {
  if (commentsListContainer.firstChild) {
    commentsListContainer.textContent = '';
  } else {
    const commentsList = createCommentsList(comments);
    commentsListContainer.appendChild(commentsList);
  }
}

function createCommentsButton(feedItem,endpointValue,feedItemElement) {
  const commentsButton = document.createElement('button');
  commentsButton.className = 'common-button';
  commentsButton.textContent = `Comments: ${feedItem.comments.length}`;
  commentsButton.addEventListener('click', () => {
    // Fetch updated data from backend
    apiCall(`job/feed?start=${endpointValue}`, 'GET')
      .then((data) => {
        // Find the updated feed item in the data and update the comment count
        const updatedFeedItem = data.find((item) => item.id === feedItem.id);
        commentsButton.textContent = `Comments: ${updatedFeedItem.comments.length}`;
        // Display the updated list of comments below the button
        const updatedComments = updatedFeedItem.comments;
        toggleCommentsList(updatedComments, feedItemElement, feedItem.commentsContainer,endpointValue);
      })
      .catch((error) => {
        displayError(error);
      });
  });
  return commentsButton;
}

function createLikesList(likes) {
  const likesList = document.createElement('ul');
  likesList.className = 'likes-list';
  likes.forEach((like) => {
    const likeElement = document.createElement('li');
    likeElement.textContent = `${like.userName} (${like.userEmail})`;
    likesList.appendChild(likeElement);
  });
  return likesList;
}

function toggleLikesList(likes, feedItemElement, likesListContainer) {
  if (likesListContainer.firstChild) {
    likesListContainer.textContent = '';
  } else {
    const likesList = createLikesList(likes);
    likesListContainer.appendChild(likesList);
  }
}

function createLikelyButton(feedItem) {
  const likelyButton = document.createElement('button');
  likelyButton.className = 'feed-item-like-btn common-button';
  let liked = feedItem.likes.some((user) => user.userId === localStorage.getItem('userId'));
  function updateLikeButton(liked) {
    if (liked) {
      likelyButton.textContent = 'Unlike it!';
    } else {
      likelyButton.textContent = 'Like it!';
    }
  }

  // Set the initial like state
  updateLikeButton(liked);
  
  likelyButton.addEventListener('click', () => {
    liked = !liked;
    apiCall('job/like', 'PUT', {
      id: feedItem.id,
      turnon: liked
    })
      .then(() => {
        updateLikeButton(liked);
      })
      .catch((error) => {
        liked = !liked;
        updateLikeButton(liked);
        displayError(error);
      });
  });

  return likelyButton;
}

const displayError = (message) => {
  const errorMessageContainer = document.getElementById('error-message');
  const errorPopup = document.getElementById('error-popup');
  errorMessageContainer.textContent = message;
  errorPopup.classList.remove('hide');
};

const setToken = (token) => {
  localStorage.setItem('token', token);
  show('section-logged-in');
  hide('section-logged-out');
  document.querySelector('nav').style.display = 'flex';
  document.querySelector('body').classList.add('logged-in');
  document.querySelector('body').classList.remove('logged-out');
}

document.getElementById('register-button').addEventListener('click', () => {
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const confirmPassword = document.getElementById('register-password-confirm').value;
  const name = document.getElementById('register-name').value;
  if (password !== confirmPassword) {
    displayError('Passwords do not match'); // Display of error messages
    return;
  }
  const payload = {
    email: email,
    password: password,
    name: name,
  };
  apiCall('auth/register', 'POST', payload)
    .then((data) => {
      setToken(data.token);
      // Redirect user to login page after successful registration
      show('page-login');
      hide('page-register');
    })
    .catch((error) => {
      displayError(error.message || 'An error occurred');
    });
});

document.getElementById('login-button').addEventListener('click', () => {
  const payload = {
    email: document.getElementById('login-email').value,
    password: document.getElementById('login-password').value
  }
  apiCall('auth/login', 'POST', payload)
    .then((data) => {
      myuserId = data.userId;
      console.log(myuserId)
      setToken(data.token);
      localStorage.getItem('token');
      localStorage.setItem('myuserId', data.userId);
      console.log('Token after login:', localStorage.getItem('token'));
      show('feed-data-page')
      populateFeed(0);
    });
});

const show = (element) => {
  document.getElementById(element).classList.remove('hide');
}

const hide = (element) => {
  document.getElementById(element).classList.add('hide');
}

document.getElementById('nav-register').addEventListener('click', () => {
  show('page-register');
  hide('page-login');
});

document.getElementById('join-us').addEventListener('click', (join) => {
  join.preventDefault(); 
  show('page-register');
  hide('page-login');
});

document.getElementById('log-in-account').addEventListener('click', (account) => {
  account.preventDefault(); 
  hide('page-register');
  show('page-login');
});

document.getElementById('nav-login').addEventListener('click', () => {
  show('page-login');
  hide('page-register');
});

function clearFeedItemElement() {
  const feedItemsContainer = document.getElementById('feed-items');
  while (feedItemsContainer.firstChild) {
    feedItemsContainer.removeChild(feedItemsContainer.firstChild);
  }
}

document.getElementById('logout').addEventListener('click', () => {
  show('section-logged-out');
  hide('section-logged-in');
  hide('profile');
  hide('post')
  localStorage.removeItem('token');
  document.getElementById("user-profile").classList.add("hide");
  document.querySelector('nav').style.display = 'none';
  document.querySelector('body').classList.add('logged-out');
  document.querySelector('body').classList.remove('logged-in');
  clearFeedItemElement()
});

if (localStorage.getItem('token')) {
  show('section-logged-in');
  hide('section-logged-out');
  document.querySelector('nav').style.display = 'flex';
  document.querySelector('body').classList.add('logged-in');
  document.querySelector('body').classList.remove('logged-out');
}

const hideError = () => {
  const errorMessageContainer = document.getElementById('error-message');
  const errorPopup = document.getElementById('error-popup');
  errorMessageContainer.textContent = ''; // Clear text content
  errorPopup.classList.add('hide');
};

document.getElementById('close-error-button').addEventListener('click', () => {
  hideError();
});


document.getElementById("feed-data").addEventListener("click", () => {
  const endpointValue = document.getElementById("endpoint-value").value;
  populateFeed(endpointValue);
});

const populateFeed = (endpointValue) => {
  console.log('endpointValue:', endpointValue);
  apiCall(`job/feed?start=${endpointValue}`, "GET", {})
    .then((data) => {
      console.log("Data from API call:", data);
      const feedItemsContainer = document.getElementById('feed-items');
      feedItemsContainer.textContent = '';
      displayFeedItems(data, endpointValue);
      feedItemsContainer.appendChild(prevButton);
      feedItemsContainer.appendChild(nextButton);
    })
    .catch((error) => {
      displayError(error);
    });
    const prevButton = document.createElement('button');
    console.log('pre', endpointValue-5);
    prevButton.textContent = 'Previous';
    prevButton.className = 'feed-pagination-prev common-button';
    prevButton.addEventListener('click', () => {
      populateFeed(endpointValue-5);
  });
  
  const nextButton = document.createElement('button');
    nextButton.textContent = 'Next';
    nextButton.className = 'feed-pagination-next common-button';
    nextButton.addEventListener('click', () => {
      populateFeed(endpointValue+5);
  });
};

function displayFeedItems(feedItems, endpointValue) {
  console.log('feedItems:', feedItems);
  const feedItemsContainer = document.getElementById('feed-items');
  
  // Clear the container before appending new feed items
  while (feedItemsContainer.firstChild) {
    feedItemsContainer.removeChild(feedItemsContainer.firstChild);
  }

  // Sort the feed items by createdAt in descending order (most recent first)
  feedItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Loop through each feed item and create the corresponding element
  for (const feedItem of feedItems) {
    const feedItemElement = createFeedItem(feedItem, endpointValue);
    feedItemsContainer.appendChild(feedItemElement);
  }
}

function createFeedItem(feedItem,endpointValue) {
  
  const feedItemElement = document.createElement('div');
  const likelyButton = createLikelyButton(feedItem);
  feedItemElement.appendChild(likelyButton);
  console.log('createFeedItemfeedItem:', feedItem);
  feedItemElement.className = 'feed-item';
  feedItemElement.style.textAlign = 'center';

  // Title of new job
  const titleElement = document.createElement('h3');
  titleElement.textContent = feedItem.title;
  titleElement.className = 'feed-item-title';
  feedItemElement.appendChild(titleElement);

  // 1. Who the jobs are posted by
  const postedByElement = document.createElement('a');
  postedByElement.href = '#';
  
  getUserInfo(localStorage.getItem('token'),feedItem.creatorId)
  .then((userInfo) => {
    console.log(userInfo); // display user info
    postedByElement.textContent = `Posted by: ${userInfo.name}`;
  })
  .catch((error) => {
    console.error(error); // display error message
  });
  postedByElement.className = 'feed-item-posted-by';
  postedByElement.addEventListener("click", function() {
      document.getElementById("feed-data-page").classList.add("hide");
      document.getElementById("profile").classList.add("hide");
      document.getElementById("post").classList.add("hide");
      document.getElementById("user-profile").classList.remove("hide");
      if (feedItem.creatorId) {
        makeuserProfile(feedItem.creatorId);
      } else {
        displayError('User ID not found.');
      }
    });
  feedItemElement.appendChild(postedByElement);

  // 2. Time of publication
  const now = new Date();
  const createdAt = new Date(feedItem.createdAt);
  const timeDiffMs = now - createdAt;
  const timeDiffHours = timeDiffMs / (1000 * 60 * 60);
  const timeDiffMinutes = (timeDiffHours - Math.floor(timeDiffHours)) * 60;

  let formattedCreatedAt;

  if (timeDiffHours < 24) {
    formattedCreatedAt = `${Math.floor(timeDiffHours)} hours, ${Math.floor(timeDiffMinutes)} minutes ago`;
  } else {
    formattedCreatedAt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'numeric', year: 'numeric' }).format(createdAt);
  }

  const createdAtElement = document.createElement('div');
  createdAtElement.textContent = formattedCreatedAt;
  createdAtElement.className = 'feed-item-created-at';
  feedItemElement.appendChild(createdAtElement);

  // 3. The job content itself
  // a. An image describing the job 
  const imgElement = document.createElement('img');
  imgElement.src = feedItem.image;
  imgElement.className = 'feed-user-image';
  feedItemElement.appendChild(imgElement);

  // b. Date of commencement of work
  const startDateElement = document.createElement('div');
  startDateElement.textContent = `Start date: ${feedItem.start}`;
  startDateElement.className = 'feed-item-start-date';
  feedItemElement.appendChild(startDateElement);

  // c. Job description text
  const descriptionElement = document.createElement('p');
  descriptionElement.textContent =feedItem.description;
  descriptionElement.className = 'feed-item-description';
  feedItemElement.appendChild(descriptionElement);
  
  //Add a button to display likes
  const likesButton = document.createElement('button');
  likesButton.textContent = `Likes: ${feedItem.likes.length}`;
  likesButton.className = 'common-button';
  likesButton.addEventListener('click', () => {
    // Fetch updated data from backend
    apiCall(`job/feed?start=${endpointValue}`, 'GET')
      .then((data) => {
        console.log(data)
        // Find the updated feed item in the data and update the like count
        const updatedFeedItem = data.find((item) => item.id === feedItem.id);
        likesButton.textContent = `Likes: ${updatedFeedItem.likes.length}`;
        // Display the updated list of likes below the button
        const updatedLikes = updatedFeedItem.likes;
        toggleLikesList(updatedLikes, feedItemElement, feedItem.likesContainer);
      })
      .catch((error) => {
        displayError(error);
      });
  });
  
  //Add a button to display comments
  const commentsButton = createCommentsButton(feedItem,endpointValue,feedItemElement);

  const buttonsContainer = document.createElement('div');
  buttonsContainer.className = 'buttons-container';
  buttonsContainer.appendChild(likesButton);
  buttonsContainer.appendChild(commentsButton);
  
  feedItem.likesContainer = document.createElement('div');
  feedItemElement.appendChild(feedItem.likesContainer);
  
  // Add the comments container and comments button
  feedItem.commentsContainer = document.createElement('div');
  feedItemElement.appendChild(feedItem.commentsContainer);

  const commentButton = document.createElement("button");
  commentButton.textContent = "Give a comment";
  commentButton.className = 'common-button';
  buttonsContainer.appendChild(commentButton);

  const commentForm = document.createElement("div");
  commentForm.style.display = "none";
  feedItemElement.appendChild(commentForm);

  const textarea = document.createElement("textarea");
  commentForm.appendChild(textarea);

  const submitCommentButton = document.createElement("button");
  submitCommentButton.textContent = "Submit comment";
  submitCommentButton.className = 'common-button';
  commentForm.appendChild(submitCommentButton);

  commentButton.addEventListener("click", () => {
      if (commentForm.style.display === "none") {
          commentForm.style.display = "block";
      } else {
          commentForm.style.display = "none";
      }
  });

  submitCommentButton.addEventListener("click", () => {
      const comment = textarea.value;
      if (comment !== "") {
        const commentData = {
            id: feedItem.id,
            comment: comment,
        };
        apiCall("job/comment", "POST", commentData)
            .then((data) => {
                console.log("Success:", data);
                textarea.value = "";
            })
            .catch((error) => {
                displayError(error);
            });
    }
  });
  feedItemElement.appendChild(buttonsContainer);
  return feedItemElement;
}
document.getElementById("home").addEventListener("click", function() {
  populateFeed(0);
  document.getElementById("feed-data-page").classList.remove("hide");
  document.getElementById("profile").classList.add("hide");
  document.getElementById("user-profile").classList.add("hide");
  document.getElementById("post").classList.add("hide");
});
document.getElementById("post-button").addEventListener("click", function() {
  document.getElementById("feed-data-page").classList.add("hide");
  document.getElementById("post").classList.remove("hide");
  document.getElementById("profile").classList.add("hide");
  document.getElementById("user-profile").classList.add("hide");
})
document.getElementById("profile-buttom").addEventListener("click", function() {
  document.getElementById("feed-data-page").classList.add("hide");
  document.getElementById("user-profile").classList.add("hide");
  document.getElementById("profile").classList.remove("hide");
  document.getElementById("post").classList.add("hide");
  const storedUserId = localStorage.getItem('myuserId');
  if (storedUserId) {
    makeProfile(storedUserId);
  } else {
    displayError('User ID not found in localStorage.');
  }
});
function makeuserProfile(myusersId) {
  getUserInfo(localStorage.getItem('token'),myusersId)
    .then((data) => {
      const profileContainer = document.getElementById('user-profile-content');
      profileContainer.classList.add('user-profile-container');
      if(profileContainer===null){
        displayuserProfile(data);}
      else{
      profileContainer.textContent = '';
      displayuserProfile(data);
      profileContainer.style.display = 'block';
      }
    })
    .catch((error) => {
      displayError(error);
    });
}
function makeProfile(myusersId) {
  getUserInfo(localStorage.getItem('token'),myusersId)
    .then((data) => {
      console.log("Data from API call:", data);
      const profileContainer = document.getElementById('profile-content');
      if(profileContainer===null){
        displayProfile(data);}
      else{
      profileContainer.textContent = '';
      displayProfile(data);
      profileContainer.style.display = 'block';
      }
    })
    .catch((error) => {
      displayError(error);
    });
}
function displayuserProfile(profileData) {
  const profileContainer = document.getElementById('user-profile-content');
  profileContainer.classList.add('user-profile-container');
  const watchedButton = document.createElement('button');
  watchedButton.textContent = 'Watch him/her!';
  watchedButton.className = 'common-button';
  watchedButton.style.display = 'none';
  profileContainer.appendChild(watchedButton);
  const unwatchedButton = document.createElement('button');
  unwatchedButton.textContent = 'Unwatch him/her!';
  unwatchedButton.className = 'common-button';
  unwatchedButton.style.display = 'none';
  profileContainer.appendChild(unwatchedButton);
  weatherWatched(profileData.id)
    .then((watched) => {
      console.log('watched:', watched);
      if (watched) {
        unwatchedButton.style.display = 'block';
        watchedButton.style.display = 'none';
        unwatchedButton.addEventListener("click", () => {
          apiCall('user/watch', 'PUT', {
              email: profileData.email,
              turnon: false
            })
            .then((watchdata) => {
              displayError("You're not watching him/her anymore!");
              makeuserProfile(profileData.id)
            })
            .catch((error) => {
              displayError(error);
            });
        });
      } else if (profileData.id === Number(localStorage.getItem('myuserId'))) {
        unwatchedButton.style.display = 'none';
        watchedButton.style.display = 'none';
      } else {
        unwatchedButton.style.display = 'none';
        watchedButton.style.display = 'block';
        watchedButton.addEventListener("click", () => {
          apiCall('user/watch', 'PUT', {
              email: profileData.email,
              turnon: true
            })
            .then((watchdata) => {
              displayError("You have successfully watched him/her!");
              makeuserProfile(profileData.id)
            })
            .catch((error) => {
              displayError(error);
            });
        });
      }
    });

  // User name
  const usernameElement = document.createElement('h2');
  usernameElement.textContent = profileData.name;
  usernameElement.classList.add('profile-name');
  profileContainer.appendChild(usernameElement);

  // User email
  const useremailElement = document.createElement('p');
  useremailElement.textContent = profileData.email;
  useremailElement.classList.add('profile-email');
  profileContainer.appendChild(useremailElement);

  // Jobs posted by user
  const userjobsPostedElement = document.createElement('h3');
  userjobsPostedElement.textContent = 'Jobs posted:';
  userjobsPostedElement.classList.add('jobs-posted-heading');
  profileContainer.appendChild(userjobsPostedElement);

  const userjobsList = document.createElement('ul');
  userjobsList.classList.add('jobs-posted-list');
  profileData.jobs.forEach((job) => {
    const jobElement = document.createElement('li');
    jobElement.classList.add('job-posted-item');

    const jobTitleElement = document.createElement('h4');
    jobTitleElement.textContent = job.title;
    jobTitleElement.classList.add('job-posted-title');
    jobElement.appendChild(jobTitleElement);

    const jobDescriptionElement = document.createElement('p');
    jobDescriptionElement.textContent = job.description;
    jobDescriptionElement.classList.add('job-posted-description');
    jobElement.appendChild(jobDescriptionElement);
    userjobsList.appendChild(jobElement);
  });
  profileContainer.appendChild(userjobsList);

  // Followers of user
  const followersElement = document.createElement('div');
  followersElement.classList.add('followers-container');
  const followersCountElement = document.createElement('p');
  followersCountElement.textContent = `Watched by ${profileData.watcheeUserIds.length} users:`;
  followersCountElement.classList.add('followers-count');
  followersElement.appendChild(followersCountElement);

  const followersListElement = document.createElement('ul');
  followersListElement.classList.add('followers-list');
  profileData.watcheeUserIds.forEach((follower) => {

    const followerElement = document.createElement('li');
    followerElement.classList.add('follower-item');

    const followerLinkElement = document.createElement('a' );
    followerLinkElement.href = '#';
    getUserInfo(localStorage.getItem('token'),follower)
    .then((userdata) => {
      followerLinkElement.textContent = userdata.name;
    })
    .catch((error) => {
      displayError(error);
    });
    followerLinkElement.addEventListener("click", function() {
      document.getElementById("feed-data-page").classList.add("hide");
      document.getElementById("profile").classList.add("hide");
      document.getElementById("post").classList.add("hide");
      document.getElementById("user-profile").classList.remove("hide");
      if (follower) {
        makeuserProfile(follower);
      } else {
        displayError('User ID not found.');
      }
    });
    followerElement.appendChild(followerLinkElement);
    followersListElement.appendChild(followerElement);
  });
  followersElement.appendChild(followersListElement);
  profileContainer.appendChild(followersElement);
}
function displayProfile(profileData) {
  const profileContainer = document.getElementById('profile-content');
  profileContainer.classList.add('profile-container');

  // User name
  const nameElement = document.createElement('h2');
  nameElement.textContent = profileData.name;
  nameElement.classList.add('profile-name');
  profileContainer.appendChild(nameElement);

  // User email
  const emailElement = document.createElement('p');
  emailElement.textContent = profileData.email;
  emailElement.classList.add('profile-email');
  profileContainer.appendChild(emailElement);

  // User image
  const imageElement = document.createElement('img');
  imageElement.src = profileData.image;
  imageElement.classList.add('feed-user-image');
  profileContainer.appendChild(imageElement);

  // Jobs posted by user
  const jobsPostedElement = document.createElement('h3');
  jobsPostedElement.textContent = 'Jobs posted:';
  jobsPostedElement.classList.add('jobs-posted-heading');
  profileContainer.appendChild(jobsPostedElement);

  const jobsList = document.createElement('ul');
  jobsList.classList.add('jobs-posted-list');
  profileData.jobs.forEach((job) => {

    const jobElement = document.createElement('li');
    jobElement.classList.add('job-posted-item');

    const deleteButton= document.createElement("button");
    deleteButton.textContent = "Delete this job!";
    deleteButton.className = 'common-button';
    const updateButton= document.createElement("button");
    updateButton.textContent = "Update this job!";
    updateButton.className = 'common-button';
    deleteButton.addEventListener("click", function() {
      apiCall('job', 'DELETE', {
        id: job.id,
      })
        .then(() => {
          displayError('The job has been successfully deleted');
          getUserInfo(localStorage.getItem('token'),profileData.id)
            .then((data) => {
              const profileContainer = document.getElementById('profile-content');
              if(profileContainer===null){
                displayProfile(data);}
              else{
                profileContainer.textContent = '';
                displayProfile(data);
                profileContainer.style.display = 'block';
              }
            })
            .catch((error) => {
              displayError(error);
            });
        })
    });
  updateButton.addEventListener("click", function() {
    const titleLabel = document.createElement('label');
    titleLabel.textContent = 'Update job title:';
    titleLabel.className = 'job-input-label';
    jobElement.appendChild(titleLabel);

    const titleInput = document.createElement('input');
    titleInput.placeholder = 'Enter job title';
    titleInput.value = job.title; 
    titleInput.className = 'form-control';
    jobElement.appendChild(titleInput);

    const imageLabel = document.createElement('label');
    imageLabel.textContent = 'Update job image:';
    imageLabel.className = 'job-input-label';
    jobElement.appendChild(imageLabel);

    const imageInput = document.createElement('input');
    imageInput.placeholder = 'Enter job image URL';
    imageInput.value = job.image;
    imageInput.className = 'form-control';
    jobElement.appendChild(imageInput);

    const startLabel = document.createElement('label');
    startLabel.textContent = 'Update job start date:';
    startLabel.className = 'job-input-label';
    jobElement.appendChild(startLabel);

    const startInput = document.createElement('input');
    startInput.placeholder = 'Enter job start date';
    startInput.value = job.start;
    startInput.className = 'form-control';
    jobElement.appendChild(startInput);

    const descriptionLabel = document.createElement('label');
    descriptionLabel.textContent = 'Update job description:';
    descriptionLabel.className = 'job-input-label';
    jobElement.appendChild(descriptionLabel);

    const descriptionInput = document.createElement('textarea');
    descriptionInput.placeholder = 'Enter job description';
    descriptionInput.value = job.description;
    descriptionInput.className = 'form-control';
    jobElement.appendChild(descriptionInput);
  
    updateButton.style.display = 'none';
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.className = 'common-button';
    
    cancelButton.addEventListener('click', function() {
      titleLabel.style.display = 'none';
      imageLabel.style.display = 'none';
      startLabel.style.display = 'none';
      descriptionLabel.style.display = 'none';
      titleInput.style.display = 'none';
      imageInput.style.display = 'none';
      startInput.style.display = 'none';
      descriptionInput.style.display = 'none';
      saveButton.style.display = 'none';
      cancelButton.style.display = 'none';
      updateButton.style.display = 'block';
    });
    jobElement.appendChild(cancelButton);
    updateButton.style.display = 'none';

    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save';
    saveButton.className = 'common-button';
    jobElement.appendChild(saveButton);
  
    saveButton.addEventListener('click', function() {
      const updatedJob = {
        id: job.id,
        title: titleInput.value,
        image: imageInput.value,
        start: startInput.value,
        description: descriptionInput.value,
      };
      apiCall('job', 'PUT', updatedJob)
        .then(() => {
          displayError('The job has been successfully updated');
          getUserInfo(localStorage.getItem('token'),profileData.id)
            .then((data) => {
              const profileContainer = document.getElementById('profile-content');
              if(profileContainer===null){
                displayProfile(data);}
              else{
                profileContainer.textContent = '';
                displayProfile(data);
                profileContainer.style.display = 'block';
              }
            })
            .catch((error) => {
              displayError(error);
            });
        })
        .catch((error) => {
          displayError(error);
        });
    });
  });
    
  const buttonsContainer = document.createElement('div');
  buttonsContainer.className = 'buttons-container';
  buttonsContainer.appendChild(deleteButton);
  buttonsContainer.appendChild(updateButton);
  jobElement.appendChild(buttonsContainer);

  const jobTitleElement = document.createElement('h4');
  jobTitleElement.textContent = job.title;
  jobTitleElement.classList.add('job-posted-title');
  jobElement.appendChild(jobTitleElement);

  const jobDescriptionElement = document.createElement('p');
  jobDescriptionElement.textContent = job.description;
  jobDescriptionElement.classList.add('job-posted-description');
  jobElement.appendChild(jobDescriptionElement);

  jobsList.appendChild(jobElement);
  });
  profileContainer.appendChild(jobsList);

  // Followers of user
  const followersElement = document.createElement('div');
  followersElement.classList.add('followers-container');

  const followersCountElement = document.createElement('p');
  followersCountElement.textContent = `Watched by ${profileData.watcheeUserIds.length} users:`;
  followersCountElement.classList.add('followers-count');
  followersElement.appendChild(followersCountElement);

  const followersListElement = document.createElement('ul');
  followersListElement.classList.add('followers-list');
  profileData.watcheeUserIds.forEach((follower) => {
    
    const followerElement = document.createElement('li');
    followerElement.classList.add('follower-item');

    const followerLinkElement = document.createElement('a' );
    followerLinkElement.href = '#';
    getUserInfo(localStorage.getItem('token'),follower)
    .then((userdata) => {
      followerLinkElement.textContent = userdata.name;
    })
    .catch((error) => {
      displayError(error);
    });
    followerLinkElement.addEventListener("click", function() {
      document.getElementById("feed-data-page").classList.add("hide");
      document.getElementById("profile").classList.add("hide");
      document.getElementById("post").classList.add("hide");
      document.getElementById("user-profile").classList.remove("hide");
      if (follower) {
        makeuserProfile(follower);
      } else {
        displayError('User ID not found.');
      }
    });
    followerElement.appendChild(followerLinkElement);
    followersListElement.appendChild(followerElement);
  });
  followersElement.appendChild(followersListElement);
  profileContainer.appendChild(followersElement);

  const updateprofileButton= document.createElement("button");
  updateprofileButton.textContent = "Update your profile!";
  updateprofileButton.className = 'common-button';
  profileContainer.appendChild(updateprofileButton);
  updateprofileButton.addEventListener("click", function() {
    const EmailLabel = document.createElement('label');
    EmailLabel.textContent = 'Update your E-mail:';
    EmailLabel.className = 'job-input-label';
    profileContainer.appendChild(EmailLabel);

    const EmailInput = document.createElement('input');
    EmailInput.placeholder = 'Enter your E-mail:';
    EmailInput.value = profileData.email; 
    EmailInput.className = 'form-control';
    profileContainer.appendChild(EmailInput);

    const NameLabel = document.createElement('label');
    NameLabel.textContent = 'Update your name:';
    NameLabel.className = 'job-input-label';
    profileContainer.appendChild(NameLabel);

    const NameInput = document.createElement('input');
    NameInput.placeholder = 'Enter your name:';
    NameInput.value = profileData.name; 
    NameInput.className = 'form-control';
    profileContainer.appendChild(NameInput);

    const PasswordLabel = document.createElement('label');
    PasswordLabel.textContent = 'Update your password:';
    PasswordLabel.className = 'job-input-label';
    profileContainer.appendChild(PasswordLabel);

    const PasswordInput = document.createElement('input');
    PasswordInput.placeholder = 'Enter your new Password:';
    PasswordInput.className = 'form-control';
    profileContainer.appendChild(PasswordInput);

    const ImageLabel = document.createElement('label');
    ImageLabel.textContent = 'Update your image:';
    ImageLabel.className = 'job-input-label';
    profileContainer.appendChild(ImageLabel);

    const ImageInput = document.createElement('input');
    ImageInput.placeholder = 'Enter your new Image:';
    ImageInput.value = profileData.image; 
    ImageInput.className = 'form-control';
    profileContainer.appendChild(ImageInput);
  
    updateprofileButton.style.display = 'none';
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.className = 'common-button';
    
    cancelButton.addEventListener('click', function() {
      NameLabel.style.display = 'none';
      NameInput.style.display = 'none';
      PasswordLabel.style.display = 'none';
      PasswordInput.style.display = 'none';
      ImageLabel.style.display = 'none';
      ImageInput.style.display = 'none';
      EmailLabel.style.display = 'none';
      EmailInput.style.display = 'none';
      saveButton.style.display = 'none';
      cancelButton.style.display = 'none';
      updateprofileButton.style.display = 'block';
    });
    profileContainer.appendChild(cancelButton);
    updateprofileButton.style.display = 'none';

    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save';
    saveButton.className = 'common-button';
    profileContainer.appendChild(saveButton);
  
    saveButton.addEventListener('click', function() {
      const updatedProfile = {
        name: NameInput.value,
        image: ImageInput.value,
        email: EmailInput.value,
        password: PasswordInput.value,
      };
      apiCall('user', 'PUT', updatedProfile)
        .then(() => {
          displayError('Your profile has been successfully updated');
          getUserInfo(localStorage.getItem('token'),profileData.id)
            .then((data) => {
              const profileContainer = document.getElementById('profile-content');
              if(profileContainer===null){
                displayProfile(data);}
              else{
                profileContainer.textContent = '';
                displayProfile(data);
                profileContainer.style.display = 'block';
              }
            })
            .catch((error) => {
              displayError(error);
            });
        })
        .catch((error) => {
          displayError(error);
        });
    });
  });
}


document.getElementById('post-submit').addEventListener('click', () => {
  const title = document.getElementById('post-title').value;
  const image = document.getElementById('post-image').value;
  const description = document.getElementById('post-description').value;
  if (title === "" || image === "" || description === "") {
    displayError('Please enter content!');
    return;
  }
  const currentTime = new Date().toISOString();

  const payload = {
    title,
    image,
    start: currentTime,
    description
  };

  apiCall('job', 'POST', payload)
    .then((data) => {
      console.log('The post has been successfully published!', data);
      clearInputFields();
      showSuccessMessage();
    })
    .catch((error) => {
      displayError(error);
    });
});

  function clearInputFields() {
    document.getElementById('post-title').value = '';
    document.getElementById('post-image').value = '';
    document.getElementById('post-description').value = '';
  }
  
  function showSuccessMessage() {
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('success-message');
    messageContainer.textContent = 'The Job has been successfully published!';
  
    document.body.appendChild(messageContainer);
  
    setTimeout(() => {
      messageContainer.remove();
    }, 3000);
  }
const getUserInfo=(token, userId)=> {
  return new Promise((resolve, reject) => {
    fetch(`http://localhost:5005/user?userId=${userId}`, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          displayError(data.error); // Display of error messages
          reject(data.error);
        } else {
          resolve(data);
        }
      })
      .catch((error) => {
        displayError(error); // Display of generic error messages
        reject(error);
      });
  });
}
function getEmailList() {
  const emailListJSON = localStorage.getItem("emailList");
  if (emailListJSON) {
    return JSON.parse(emailListJSON);
  } else {
    return [];
  }
}

function setEmailList(emailList) {
  localStorage.setItem("emailList", JSON.stringify(emailList));
}

const feedPage = document.getElementById("watchContainer");
const watchButton = document.getElementById("watch-button");

watchButton.addEventListener("click", () => {
  const watchEmail = document.getElementById("watchEmail").value;
  watchButton.style.display = 'none';
  const emailList = getEmailList();
  if (!emailList.includes(watchEmail)) {
    const submitButton = document.createElement('button');
    submitButton.textContent = 'Submit!';
    submitButton.className = 'common-button';
    feedPage.appendChild(submitButton);
    submitButton.addEventListener("click", () => {
    apiCall('user/watch', 'PUT',{
      email: watchEmail,
      turnon: true
    })
    .then((data) => {
      submitButton.remove();
      watchButton.style.display = 'block';
      displayError("You have successfully watched him/her!");
      emailList.push(watchEmail);
      setEmailList(emailList);
      populateFeed(0);
    })
    .catch((error) => {
      displayError(error);
    });
  });
}
  else {
    const unwatchButton = document.createElement('button');
    unwatchButton.textContent = 'unwatch him/her!';
    unwatchButton.className = 'common-button';
    feedPage.appendChild(unwatchButton);
    unwatchButton.addEventListener("click", () => {
      apiCall('user/watch', 'PUT',{
        email: watchEmail,
        turnon: false
      })
      .then((data) => {
        const index = emailList.indexOf(watchEmail);
        if (index > -1) {
          emailList.splice(index, 1);
          setEmailList(emailList);
        }
        unwatchButton.remove();
        watchButton.style.display = 'block';
        displayError("You're not watching him/her anymore!");
        populateFeed(0);
      })
      .catch((error) => {
        displayError(error);
      });
    });
  };
});

window.onload = () => {
  const feedDataPageElement = document.getElementById("feed-data-page");
  if (feedDataPageElement !== null) {
    populateFeed(0);
  }
};
function weatherWatched(id){
  return getUserInfo(localStorage.getItem('token'),id)
  .then((data) => {
    if(data.watcheeUserIds.includes(Number(localStorage.getItem('myuserId')))){
      console.log('true',data);
      return true;
    }
    else{
      console.log('false',data);
      return false;
    }
  });
}