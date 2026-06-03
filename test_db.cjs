const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');
db.serialize(() => {
    db.run('CREATE TABLE conversations (id TEXT, title TEXT, user_id TEXT, created_at DATETIME)');
    db.run('CREATE TABLE message_logs (id INTEGER PRIMARY KEY, conversation_id TEXT, role TEXT, content TEXT)');
    db.run("INSERT INTO conversations VALUES ('1', 'Khởi tạo', 'user1', '2023-01-01')");
    db.run("INSERT INTO message_logs (conversation_id, role, content) VALUES ('1', 'user', 'Will I get the job?')");
    db.all(`SELECT c.id, CASE WHEN c.title = 'Khởi tạo' THEN COALESCE((SELECT 'Trải bài: ' || SUBSTR(content, 1, 50) || CASE WHEN LENGTH(content) > 50 THEN '...' ELSE '' END FROM message_logs m WHERE m.conversation_id = c.id AND m.role = 'user' ORDER BY m.id ASC LIMIT 1), c.title) ELSE c.title END as title, c.created_at FROM conversations c WHERE c.user_id = 'user1' ORDER BY c.created_at DESC`, (err, rows) => {
        if (err) console.error(err);
        else console.log(rows);
    });
});
