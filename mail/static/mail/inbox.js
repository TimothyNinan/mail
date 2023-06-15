document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  // By default, load the inbox
  load_mailbox('inbox');
  document.querySelector('#compose').addEventListener('click', compose_email);
});

function send_email(e) {
  e.preventDefault();
  console.log("Form Submitted");
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: document.querySelector("#compose-recipients").value,
      subject: document.querySelector("#compose-subject").value,
      body: document.querySelector("#compose-body").value
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(result => {
    console.log(result);
  });

  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#details-view').style.display = 'none';

  setTimeout(list_Sent, 500);

  
  
  return false;
}

function list_Sent() {
  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = '<h3>Sent</h3>';
  fetch('/emails/sent')
  .then(response => response.json())
  .then(emails => {
      // Print emails
      console.log(emails);
      emails.forEach(list_Mail)

  });
}

function list_Mail(email) {
  const email_item = document.createElement('div');
  const id = humanize(email.id);
  email_item.id = id;
  email_item.style.border = "1px solid lightgray";
  email_item.style.borderRadius = ".2rem"
  email_item.style.flexDirection = "row";
  email_item.style.display = "flex";
  email_item.style.padding = "10px";
  email_item.style.marginBottom = "5px";
  email_item.style.width = "100%";
  if (email.read) {
    email_item.style.backgroundColor = "#e9ecef";
  } else {
    email_item.style.backgroundColor = "white";
  }
  email_item.addEventListener('click', function() {
    console.log('This element has been clicked!')
    view_email(email.id);
  });

  const sender_item = document.createElement('b');

  sender_item.innerHTML = `To: ${email.recipients}`;

  sender_item.style.paddingRight = "20px";

  const subject_item = document.createElement('span');
  subject_item.innerHTML = email.subject;

  const timestamp_item = document.createElement('span');
  timestamp_item.innerHTML = email.timestamp;
  timestamp_item.style.color = "gray";
  timestamp_item.style.marginLeft = "auto";

  console.log(id);
  document.querySelector('#emails-view').append(email_item);
  document.querySelector(`#${id}`).append(sender_item);
  document.querySelector(`#${id}`).append(subject_item);
  document.querySelector(`#${id}`).append(timestamp_item);
}

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#details-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  document.getElementById('compose-form').addEventListener('submit', function (event){
    send_email(event);
  });
  
}

//Numbers to words from https://gist.github.com/ForbesLindesay/5467742
function humanize(num){
  var ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
              'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
              'seventeen', 'eighteen', 'nineteen'];
  var tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty',
              'ninety'];

  var numString = num.toString();

  if (num < 0) throw new Error('Negative numbers are not supported.');

  if (num === 0) return 'zero';

  //the case of 1 - 20
  if (num < 20) {
    return ones[num];
  }

  if (numString.length === 2) {
    return tens[numString[0]] + '' + ones[numString[1]];
  }

  //100 and more
  if (numString.length == 3) {
    if (numString[1] === '0' && numString[2] === '0')
      return ones[numString[0]] + ' hundred';
    else
      return ones[numString[0]] + ' hundred and ' + convert(+(numString[1] + numString[2]));
  }

  if (numString.length === 4) {
    var end = +(numString[1] + numString[2] + numString[3]);
    if (end === 0) return ones[numString[0]] + ' thousand';
    if (end < 100) return ones[numString[0]] + ' thousand and ' + convert(end);
    return ones[numString[0]] + ' thousand ' + convert(end);
  }
}

function view_email(id) {
  document.querySelector('#details-view').innerHTML = "";
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
      // Print emails
      console.log(email);
      
      document.querySelector('#emails-view').style.display = 'none';
      document.querySelector('#details-view').style.display = 'block';
      document.querySelector('#compose-view').style.display = 'none';

      const sender = document.createElement('div');
      sender.innerHTML = `<b>From: </b>${email.sender}`;

      const recipients = document.createElement('div');
      recipients.innerHTML = `<b>To: </b>${email.recipients}`;

      const subject = document.createElement('div');
      subject.innerHTML = `<b>Subject: </b>${email.subject}`;

      const timestamp = document.createElement('div');
      timestamp.innerHTML = `<b>Timestamp: </b>${email.timestamp}`;

      const button = document.createElement('button');
      button.innerHTML = "Reply";
      button.className = "btn btn-sm btn-outline-primary";
      button.id = "reply";
      button.style.marginRight = "5px";
      button.addEventListener('click', function() {
        console.log('This Reply Button has been clicked!')
        fetch(`/emails/${id}`)
        .then(response => response.json())
        .then(email => {
          compose_email();
          document.querySelector("#compose-recipients").value = `${email.sender}`;
          document.querySelector("#compose-recipients").disabled = true;
          if (email.subject.indexOf('Re:') !== -1) {
            document.querySelector("#compose-subject").value = `${email.subject}`;
          } else {
            document.querySelector("#compose-subject").value = `Re: ${email.subject}`;
          }
          document.querySelector("#compose-subject").disabled = true;
          document.querySelector('#compose-body').value = `On ${email.timestamp}, ${email.sender} wrote: ${email.body}`;
        })
      });

      
      const archive = document.createElement('button');
      if (email.archived) {
        archive.innerHTML = "UnArchive";
      }
      else {
        archive.innerHTML = "Archive";
      }
      archive.className = "btn btn-sm btn-outline-primary";
      archive.id = "reply";
      archive.addEventListener('click', function() {
        console.log('This Archive Button has been clicked!')
        if (archive.innerHTML === "UnArchive") {
          fetch(`/emails/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
                archived: false
            })
          
          })
          .then(()=>{
            console.log('Archive set false');
            load_mailbox('inbox');
          })
          
        } else {
          fetch(`/emails/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
                archived: true
            })
          })
          .then(()=>{
            console.log('Archive set true');
            load_mailbox('inbox');
          })
        }
      });
      


      const line = document.createElement('hr');

      const body = document.createElement('div');
      body.innerHTML = `${email.body}`;
      body.style.fontSize = "15px";

      document.querySelector('#details-view').append(sender);
      document.querySelector('#details-view').append(recipients);
      document.querySelector('#details-view').append(subject);
      document.querySelector('#details-view').append(timestamp);
      document.querySelector('#details-view').append(button);
      document.querySelector('#details-view').append(archive);
      document.querySelector('#details-view').append(line);
      document.querySelector('#details-view').append(body);

  });

  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })
}

function load_mailbox(mailbox) {
  
  function list_Email(email) {
    const email_item = document.createElement('div');
    const id = humanize(email.id);
    email_item.id = id;
    email_item.style.border = "1px solid lightgray";
    email_item.style.borderRadius = ".2rem"
    email_item.style.flexDirection = "row";
    email_item.style.display = "flex";
    email_item.style.padding = "10px";
    email_item.style.marginBottom = "5px";
    email_item.style.width = "100%";
    if (email.read) {
      email_item.style.backgroundColor = "#e9ecef";
    } else {
      email_item.style.backgroundColor = "white";
    }
    email_item.addEventListener('click', function() {
      console.log('This element has been clicked!')
      view_email(email.id);
    });

    const sender_item = document.createElement('b');
    if (mailbox === 'sent'){
      sender_item.innerHTML = `To: ${email.recipients}`;
    } else {
      sender_item.innerHTML = email.sender;
    }
    sender_item.style.paddingRight = "20px";

    const subject_item = document.createElement('span');
    subject_item.innerHTML = email.subject;

    const timestamp_item = document.createElement('span');
    timestamp_item.innerHTML = email.timestamp;
    timestamp_item.style.color = "gray";
    timestamp_item.style.marginLeft = "auto";

    console.log(id);
    document.querySelector('#emails-view').append(email_item);
    document.querySelector(`#${id}`).append(sender_item);
    document.querySelector(`#${id}`).append(subject_item);
    document.querySelector(`#${id}`).append(timestamp_item);
  }

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#details-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // Print emails
      console.log(emails);
      emails.forEach(list_Email)

  });
}