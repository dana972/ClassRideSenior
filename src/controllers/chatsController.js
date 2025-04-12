const db = require('../config/db');

exports.getConversations = async (req, res) => {
  try {
    const Phone = req.user.phone_number;
    // Ensure the logged-in user's phone is available
    if (!Phone) {
      return res.status(401).send("Unauthorized: User phone number not found.");
    }
    
    // Fetch chats where the logged-in user is a participant and join with the users table to get the other participant's full name
    const result = await db.query(
      `
      SELECT 
        c.chat_id, 
        c.participant_1_phone, 
        c.participant_2_phone,
        u.full_name AS other_full_name
      FROM chats c
      JOIN users u 
        ON u.phone_number = CASE 
                              WHEN c.participant_1_phone = $1 THEN c.participant_2_phone 
                              ELSE c.participant_1_phone 
                            END
      WHERE c.participant_1_phone = $1 OR c.participant_2_phone = $1
      `,
      [Phone]
    );
    
    // Map the result to an array of conversation objects using the other participant's full name
    const conversations = result.rows.map(row => ({
      id: row.chat_id,
      name: row.other_full_name
    }));
    
    // Render the 'conversations' view with the conversations array and the current user's phone number
    res.render('partials/conversations', { conversations, currentUserPhone: Phone });
  } catch (error) {
    console.error('Error fetching conversations:', error.message);
    res.status(500).send('Internal Server Error');
  }
};

exports.getMessages = async (req, res) => {
  try {
    const chatId = req.params.chatId;
    
    // Fetch messages for the specified chat, ordered by the sent time,
    // joining with the users table to get the sender's full name
    const result = await db.query(
      `
      SELECT 
        m.message_id, 
        m.chat_id, 
        m.sender_phone, 
        u.full_name AS sender_name, 
        m.message_text, 
        m.sent_at
      FROM messages m
      JOIN users u ON m.sender_phone = u.phone_number
      WHERE m.chat_id = $1
      ORDER BY m.sent_at ASC
      `,
      [chatId]
    );
    
    const messages = result.rows;
    
    // Return the messages in JSON format so the frontend can load them via AJAX
    res.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
