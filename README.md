[![Build Status](https://travis-ci.org/wilsto/BoardOS.svg)](https://travis-ci.org/wilsto/BoardOS)
[![Coverage Status](https://coveralls.io/repos/wilsto/BoardOS/badge.svg)](https://coveralls.io/r/wilsto/BoardOS)
[![Issue Stats](http://issuestats.com/github/wilsto/boardos/badge/issue)](http://issuestats.com/github/wilsto/boardos)
[![Average time to resolve an issue](http://isitmaintained.com/badge/resolution/wilsto/boardos-issues.svg)](http://isitmaintained.com/project/wilsto/boardos-issues "Average time to resolve an issue")
[![Percentage of issues still open](http://isitmaintained.com/badge/open/wilsto/boardos-issues.svg)](http://isitmaintained.com/project/wilsto/boardos-issues "Percentage of issues still open")

BoardOS
====

Board Of Supervision 
(Operational Dashboarding)


###Technos

BOSS utilise les technos suivantes pour fonctionner correctement :

BackEnd
* [node.js] - evented I/O for the backend
* [Express] - fast node.js network app framework
* [Passport] - Simple, unobtrusive authentication for Node.js.
* [MongoDB] -  open-source document database, and the leading NoSQL database

FontEnd
* [Twitter Bootstrap] - great UI boilerplate for modern web apps
* [AngularJS] - Superheroic JavaScript MVW Framework

---

###Installation au niveau système
A faire une fois par PC
 
* Installer [Node.js]
* Installer [MongoDB]
* Installer [Grunt] sur le système (-g) via une fenetre DOS 

```sh
npm install -g grunt-cli
```

* Installer [Bower] sur le système (-g)

```sh
npm install -g bower
```

---

###Installation des dépendances au niveau de l'application
* Ouvrir une fenetre DOS au niveau du répertoire ou les fichiers ont été téléchargés, on va installer en local (donc pas de -g dans les lignes de commandes) les modules nodejs et dependances.

```sh
npm install
```
Cela va créer un repertoire node_modules et télécharger tous les modules dont nous avons besoin. Cela marche grace au fichier *package.json* 

* Installer en local (donc pas de -g dans les lignes de commandes) les dépendances référencées grace à bower. Cela marche grace au fichier _bower.json_

```sh
bower install
```
Cela va créer un repertoire bower_components au niveau du repertoire app. Si bower pose des questions, il faut les réponses qui contiennent le mot "WorlProno2014"


###Lancement de l'application en mode developpement
après c'est magique, on tape

```sh
grunt serve
```
et ca lance tout
---

###Annexes

#####Yeoman:
Il s'agit d'une application basée sur [AngularJS Full Stack] : Yeoman generator for creating MEAN stack applications, using MongoDB, Express, AngularJS, and Node. Featuring:
* Express server integrated with grunt tasks
* Livereload of client and server files - _toute modification sur un fichier recharge la page web instantanément_
* Support for Jade and CoffeeScript
* Easy deployment workflow.
* Optional MongoDB integration 
* Optional Passport integration for adding user accounts

#####Vidéos de formations:
Retrouver des vidéos de formation super bien faites et en francais sous [Graphikart](http://www.grafikart.fr)
* [AngularsJS](http://www.grafikart.fr/formation/angularjs)
* [Nodejs chat](http://www.grafikart.fr/tutoriels/nodejs/nodejs-socketio-tchat-366)
* [Bower](http://www.grafikart.fr/tutoriels/javascript/bower-474)
* [Grunt](http://www.grafikart.fr/tutoriels/grunt/grunt-introduction-470)
* [Yeoman](http://www.grafikart.fr/tutoriels/internet/yeoman-475) _que vous pouvez (devez ?! ;-b) installer si vous souhaitez créer une autre appli en partant de zéro_

#####Editeur de code html/js/css:
* [Sublime Text 3] pour coder avec plein de plugins, très sympa. 

---

** Have fun!**

[john gruber]:http://daringfireball.net/
[Node.js]:http://nodejs.org
[Twitter Bootstrap]:http://twitter.github.com/bootstrap/
[jQuery]:http://jquery.com
[express]:http://expressjs.com
[Grunt]:http://gruntjs.com/
[Bower]:http://bower.io/
[AngularJS]:http://gruntjs.com/
[Passport]:http://passportjs.org/
[MongoDB]:http://www.mongodb.org/
[AngularJS Full Stack]:https://github.com/DaftMonk/generator-angular-fullstack
[Sublime Text 3]:http://www.sublimetext.com/