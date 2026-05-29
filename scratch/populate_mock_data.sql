UPDATE tarot_database
SET 
  upright_keyword = hex(randomblob(4)),
  reversed_keyword = hex(randomblob(4)),
  upright_love_keyword = hex(randomblob(4)),
  upright_career_keyword = hex(randomblob(4)),
  upright_finances_keyword = hex(randomblob(4)),
  reversed_love_keyword = hex(randomblob(4)),
  reversed_career_keyword = hex(randomblob(4)),
  reversed_finances_keyword = hex(randomblob(4)),
  upright_love_meaning = hex(randomblob(4)),
  upright_career_meaning = hex(randomblob(4)),
  upright_finances_meaning = hex(randomblob(4)),
  reversed_love_meaning = hex(randomblob(4)),
  reversed_career_meaning = hex(randomblob(4)),
  reversed_finances_meaning = hex(randomblob(4));
