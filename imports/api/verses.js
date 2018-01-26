import {Meteor} from 'meteor/meteor';
import {Mongo} from 'meteor/mongo';
import {check} from 'meteor/check';

export const Translations = new Mongo.Collection('translations');
export const Books = new Mongo.Collection('books');
export const Verses = new Mongo.Collection('verses');
export const Chapters = new Mongo.Collection('chapters');
export const ShiftedVerses = new Mongo.Collection('shiftedverses');

if (Meteor.isServer) {

  // Meteor.smartPublish - to mi się już raczej nie przyda, ale warto zapamiętać, że takie coś istnieje

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

  /*

      Tutaj mamy zestaw procedur wykorzystywanych w panelu dostępnym dla admina, gdzie może zsynchronizować numerację wersetów pomiędzy przekładami
      to jest używane tylko lokalnie, na produkcji to nie będzie raczej potrzebne

      - insert: wstawianie w dowolnym miejscu nowego wersetu (z przesunięciem następnych)
      - remove: usunięcie dowolnego wersetu (z przesunięciem wstecz następnych)
      - update: aktualizacja wersetu
      - shift: przesunięcie części wersetów na przód następnego rozdziału
      - shiftback: przesunięcie części wersetów na tył poprzedniego rozdziału

      AUTORYZACJĘ WSTAWIĆ PÓŹNIEJ, ŻEBYM TYLKO JA MÓGŁ INSERTOWAĆ I USUWAĆ !!!

      if (! this.userId) {
        throw new Meteor.Error('not-authorized');
      }

      I JESZCZE DOROBIĆ SPRAWDZANIE TYPÓW PRZEKAZYWANYCH DANYCH LICZBOWYCH I TEKSTOWYCH !!!
      (mimo, że tylko ja będę miał do tego dostęp to tak będzie bardziej elegancko)

      check(verseId, String);

  */

Meteor.methods({
  'verses.insert' (t, b, c, v, verses) {

    newv = verses[verses.length - 1].v + 1;

    Verses.insert({
      _id: (t + '.' + b + '.' + c + '.' + newv),
      t: t,
      b: b,
      c: c,
      v: newv,
      x: verses[verses.length - 1].x
    });

    if ((newv - 1) > v) {
      _.range((newv - 1), v, -1).map((vnum) => {
        Verses.update(verses[vnum - 1]._id, {
          $set: {
            x: verses[vnum - 2].x
          }
        });
      })
    }

  },

  'verses.remove' (t, b, c, v, verses) {
    if (v < verses.length) {
      _.range(v, verses.length).map((vnum) => {
        Verses.update(verses[vnum - 1]._id, {
          $set: {
            x: verses[vnum].x
          }
        });
      })
    }

    Verses.remove((t + '.' + b + '.' + c + '.' + verses.length));

  },

  'verses.update' (verseId, x) {
    check(verseId, String);
    check(x, String);
    Verses.update(verseId, {
      $set: {
        x: x
      }
    });
  },

  'verses.shift' (t, b, c, v) {

    ShiftedVerses.remove({});

    c2 = c + 1;

    v2 = 0;
    Verses.find({
      t: t,
      b: b,
      c: c,
      v: {
        $gte: v
      }
    }).forEach(function(doc) {
      v2++;
      Verses.remove({_id: doc._id});
      doc.v = v2;
      doc.c = c2;
      doc._id = doc.t + '.' + doc.b + '.' + c2 + '.' + doc.v;
      ShiftedVerses.insert(doc);
    });

    Verses.find({t: t, b: b, c: c2}).forEach(function(doc) {
      Verses.remove({_id: doc._id});
      doc.v = doc.v + v2;
      doc._id = doc.t + '.' + doc.b + '.' + doc.c + '.' + doc.v;
      ShiftedVerses.insert(doc);
    });

    ShiftedVerses.find().forEach(function(doc) {
      Verses.insert(doc);
    });

    ShiftedVerses.remove({});

  },

  'verses.shiftback' (t, b, c, v) {

    ShiftedVerses.remove({});

    c2 = c - 1;

    c2l = Verses.find({t: t, b: b, c: c2}).count();
    v2 = c2l;

    Verses.find({
      t: t,
      b: b,
      c: c,
      v: {
        $lte: v
      }
    }).forEach(function(doc) {
      v2++;
      Verses.remove({_id: doc._id});
      doc.v = v2;
      doc.c = c2;
      doc._id = doc.t + '.' + doc.b + '.' + doc.c + '.' + doc.v;
      ShiftedVerses.insert(doc);
    });

    Verses.find({
      t: t,
      b: b,
      c: c,
      v: {
        $gt: v
      }
    }).forEach(function(doc) {
      Verses.remove({_id: doc._id});
      doc.v = doc.v - v;
      doc._id = doc.t + '.' + doc.b + '.' + c + '.' + doc.v;
      ShiftedVerses.insert(doc);
    });

    ShiftedVerses.find().forEach(function(doc) {
      Verses.insert(doc);
    });

    ShiftedVerses.remove({});

  }
});

/*

Skrypt wyszukujący rozdziały z kopniętą numeracją wersetów
Bezpośrednio w bazie danych sobie zapuszczam jak chcę sprawdzić czy coś jeszcze się nie zgadza

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
