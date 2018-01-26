import React, {Component} from 'react';
import {ReactDOM, findDOMNode} from 'react-dom';
import {Meteor} from 'meteor/meteor';
import {withTracker} from 'meteor/react-meteor-data';
import AccountsUIWrapper from './AccountsUIWrapper.jsx';
import {Translations, Books, Verses, Chapters} from '../api/verses.js';

import Window from './Window.jsx';

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      brokenChapter: 0,
      admin: false
    };
  }

  // ta funkcja to jest przydatna tylko jak dodaję nowy przekład do bazy,
  // bo jeśli są różnice numeracji wersetów to trzeba zsynchronizować ze standardem KJV/UBG wtedy
  openNextBrokenChapter() {
    let book = this.props.chapters[this.state.brokenChapter].b;
    let chapter = this.props.chapters[this.state.brokenChapter].c;

    let windows = Session.get('windows');

    // tlumaczenia ktore były do poprawki (już poprawiłem)
    let translacje = [2, 1, 3, 4, 5, 6, 13, 14, 15, 16, 17, 25];

    translacje.forEach(function(translation) {
      windows.push({t: translation, b: book, c: chapter, v: 0, v2: 0});
    });

    Session.set('windows', windows);

    this.setState({
      brokenChapter: this.state.brokenChapter + 1
    });
  }

  // otwiera nowe okno po kliknięciu w przycisk
  openNewWindow() {
    let windows = Session.get('windows');
    // akurat psalm 142 ustawiłem na otwarcie, ale potem zmienie na losowe
    windows.push({t: 1, b: 19, c: 142, v: 0, v2: 0});
    Session.set('windows', windows);
  }

  render() {

    return (
      <div className="body">

        {/*
          na razie rejestracja/logowanie zbędne, ale przy rozbudowie dodam
          <div className="menu"><AccountsUIWrapper /></div>
        */}

        <div className="header">
          <a href=""><img src="/blackandwhitelogo.svg"/>
            <span>Wersety.com</span>
          </a>
        </div>

        {this.renderWindows()}

        <div className="menu">
          <button className="green" onClick={() => {
            if (this.state.admin) {
              this.openNextBrokenChapter();
            } else {
              this.openNewWindow();
            }
          }}>
            <i className="fa fa-plus"></i>
            Otwórz nowe okno</button>

          {this.props.verses.length > 0 && <button className="red" onClick={() => {
            Session.set('windows', new Array());
          }}>
            <i className="fa fa-remove"></i>
            Zamknij wszystkie okna</button>
          }

        </div>

        <div className="footer">
          Andrzej Konopka © Wrocław 2017-2018 Warszawa
        </div>

      </div>
    );
  }

  // renderuj okna
  renderWindows() {
    return this.props.verses.map((verses, index) => {
      return (
        <Window
          key={index}
          index={index}
          verses={verses}
          params={Session.get('windows')[index]}
          translations={this.props.translations}
          books={this.props.books}
          admin={this.state.admin}/>
      );
    });
  }

}

/******************************************************************************/
/* WITHRACKER (subskrypcje) ***************************************************/
/******************************************************************************/

export default AppContainer = withTracker(props => {

  // domyślnie, na otwarcie aplikacji nie ma okien żadnych
  // ale póżniej dorobię, że coś losowego się otworzy na start
  let windows = new Array();
  Session.setDefault('windows', windows);

  // wszystkie tlumaczenia i ksiazki subskrybujemy
  Meteor.subscribe('translations');
  Meteor.subscribe('books');
  Meteor.subscribe('chapters');

  // budowanie zapytań do bazy danych na podstawie tego co otworzone w okienkach
  let queries = new Array;
  Session.get('windows').map((w) => {
    let q = new Object;
    if (w.t > 0)
      q.t = w.t;
    q.b = w.b;
    if (w.v2 == 0) {
      q.c = w.c;
      if (w.v > 0)
        q.v = w.v;
      }
    else if (w.v2 > 0) {
      q.c = w.c;
      q.v = {
        $gte: w.v,
        $lte: w.v2
      };
    } else {
      q.$or = [
        {
          c: w.c,
          v: {
            $gte: w.v
          }
        }, {
          c: (w.c + 1),
          v: {
            $lte: (-w.v2)
          }
        }
      ];
    }
    queries.push(q);
  })

  // subskrybujemy tylko te wersety, jakie sa w okienkach otwarte
  Meteor.subscribe('verses', {$or: queries});

  // pakujemy poszczególne wersety do odpowiadających im okienek
  let verses = new Array;
  queries.map(query => verses.push(Verses.find(query, {
    sort: {
      t: 1,
      b: 1,
      c: 1,
      v: 1
    }
  }).fetch()));

  // zwracamy posortowane tłumaczenia, księgi, wersety, użytkownika
  return {translations: Translations.find({}, {
      sort: {
        _id: 1
      }
    }).fetch(), books: Books.find({}, {
      sort: {
        _id: 1
      }
    }).fetch(), verses: verses, currentUser: Meteor.user(), chapters: Chapters.find({}, {
      sort: {
        b: 1,
        c: 1
      }
    }).fetch()};

})(App);
