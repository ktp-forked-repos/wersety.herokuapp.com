import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

export const Translations = new Mongo.Collection('translations');
export const Books = new Mongo.Collection('books');
export const Verses = new Mongo.Collection('verses');
export const Chapters = new Mongo.Collection('chapters');
export const status_new = new Mongo.Collection('status_new');

if (Meteor.isServer) {

  //Meteor.smartPublish
  Meteor.publish('translations', () => {
    return Translations.find({}, {});
  });
  Meteor.publish('books', () => {
    return Books.find({}, {});
  });
  Meteor.publish('verses', (query) => {
    return Verses.find(query, {});
  });
  Meteor.publish('chapters', () => {
    return Chapters.find({}, {});
  });
}

Meteor.methods({
  'verses.insert'(t, b, c, v, verses) {

    // Make sure the user is logged in before inserting a task
    /*if (! this.userId) {
      throw new Meteor.Error('not-authorized');
    }*/
    // (dorób to później)

    newv = verses[verses.length - 1].v + 1;

    Verses.insert({
      _id: (t + '.' + b + '.' + c + '.' + newv),
      t: t,
      b: b,
      c: c,
      v: newv,
      x: verses[verses.length - 1].x
    });

    if((newv - 1) > v) {
      _.range((newv - 1), v, -1).map((vnum) => {
        Verses.update(verses[vnum - 1]._id, { $set: { x: verses[vnum - 2].x } });
      })
    }

  },


  'verses.remove'(t, b, c, v, verses) {
    //check(verseId, String);

    if(v < verses.length) {
      _.range(v, verses.length).map((vnum) => {
        Verses.update(verses[vnum - 1]._id, { $set: { x: verses[vnum].x } });
      })
    }

    Verses.remove((t + '.' + b + '.' + c + '.' + verses.length));

  },


  'verses.update'(verseId, x) {
    check(verseId, String);
    check(x, String);
    Verses.update(verseId, { $set: { x: x } });
  },



    'verses.shift'(t, b, c, v) {

      status_new.remove({});

      ch1 = c;
      verse = v;
      ch2 = c + 1;

      ile = 0;
      Verses.find({ t:t, b:b, c:ch1, v: {$gte: verse} }).forEach(function(doc){
          ile++;
          Verses.remove({_id: doc._id});
          doc.v = ile;
          doc.c = ch2;
          doc._id = doc.t + '.' + doc.b + '.' + ch2 + '.' + doc.v;
          status_new.insert(doc);
      });

      Verses.find({ t:t, b:b, c:ch2 }).forEach(function(doc){
          Verses.remove({_id: doc._id});
          doc.v = doc.v + ile;
          doc._id = doc.t + '.' + doc.b + '.' + doc.c + '.' + doc.v;
          status_new.insert(doc);
      });

      status_new.find().forEach(function(doc){
          Verses.insert(doc);
      });

      status_new.remove({});

    },


  'verses.shiftback'(t, b, c, v) {

    status_new.remove({});

    ch1 = c;
    verse = v;
    ch2 = c - 1;

    ch2l = Verses.find({ t:t, b:b, c:ch2 }).count();
    ile = ch2l;

    Verses.find({ t:t, b:b, c:ch1, v: {$lte: verse} }).forEach(function(doc){
        ile++;
        Verses.remove({_id: doc._id});
        doc.v = ile;
        doc.c = ch2;
        doc._id = doc.t + '.' + doc.b + '.' + doc.c + '.' + doc.v;
        status_new.insert(doc);
    });

    Verses.find({ t:t, b:b, c:ch1, v: {$gt: verse} }).forEach(function(doc){
        Verses.remove({_id: doc._id});
        doc.v = doc.v - verse;
        doc._id = doc.t + '.' + doc.b + '.' + ch1 + '.' + doc.v;
        status_new.insert(doc);
    });

    status_new.find().forEach(function(doc){
        Verses.insert(doc);
    });

    status_new.remove({});

  },

});

/*

skrypt wyszukujący kopnięte rozdziały:

db.getCollection('verses').aggregate([
    {
        $group: {
            '_id': {
                'b': '$b',
                'c': '$c',
                't': '$t'
                },
            verses: { $sum: 1 }
            }
    },
    {
        $group: {
            '_id': {
                'b': '$_id.b',
                'c': '$_id.c',
                'verses': '$verses'
                }
            }
    },
    {
        $group: {
            '_id': {
                'b': '$_id.b',
                'c': '$_id.c'
                },
            versions: { $sum: 1 }
            }
    },
    {
        $match: {
            'versions': { $gt: 1 }
        }
    },
    {
        $project: {
            '_id': '$_id.b' + ' ' + '$_id.c',
            'b': '$_id.b',
            'c': '$_id.c'
        }
    }
]).forEach(function(doc){
   db.chapters.insert(doc);
});

*/
