PRAGMA foreign_keys = off;

DROP TABLE IF EXISTS user;
CREATE TABLE user (
    account_ident TEXT NOT NULL,
    domain_ident TEXT NOT NULL,
    passwordhash TEXT NOT NULL,
    nonce TEXT NOT NULL,
    publickey TEXT NOT NULL,
    privatekeyenc TEXT NOT NULL,

    PRIMARY KEY (account_ident)
) WITHOUT ROWID;

DROP TABLE IF EXISTS config;
CREATE TABLE config (
    key TEXT NOT NULL,
    value TEXT NOT NULL,

    PRIMARY KEY (key)
) WITHOUT ROWID;

INSERT INTO config(key, value) VALUES
    ('diva.websocket', '["localhost:3912"]'),

    ('diva.api.uri', '["localhost:3912"]'),
    ('iroha.node.local', '172.22.2.5:19012'),

    ('iroha.torii.development', '172.22.2.3:50051'),
    ('iroha.torii', '172.22.2.3:50051'),
    ('iroha.postgres.host.development', '172.20.101.2'),
    ('iroha.postgres.host', '172.20.101.2'),
    ('iroha.postgres.port.development', '5432'),
    ('iroha.postgres.port', '5432'),
    ('iroha.postgres.database', 'iroha'),
    ('iroha.postgres.user', 'iroha'),
    ('iroha.postgres.password', 'iroha'),

    ('i2p.webconsole.scraper.url', 'http://172.22.2.2:7070/?page=i2p_tunnels'),
    ('i2p.http.proxy.development', '172.22.2.2:4444'),
    ('i2p.http.proxy', '172.22.2.2:4444'),
    ('i2p.socks.proxy.development', '172.22.2.2:4445'),
    ('i2p.socks.proxy', '172.22.2.2:4445');

DROP TABLE IF EXISTS language;
CREATE TABLE language (
    language_ident TEXT NOT NULL,

    PRIMARY KEY (language_ident),
    FOREIGN KEY (language_ident) REFERENCES culture(ident)
) WITHOUT ROWID;

INSERT INTO language (language_ident) VALUES
    ('en'),
    ('de'),
    ('ru'),
    ('zh'),
    ('ko');

DROP TABLE IF EXISTS culture;
CREATE TABLE culture (
    language_ident TEXT NOT NULL,
    ident TEXT NOT NULL,
    text TEXT NOT NULL,

    PRIMARY KEY (language_ident, ident),
    FOREIGN KEY (language_ident) REFERENCES language(language_ident)
) WITHOUT ROWID;

INSERT INTO culture (language_ident, ident, text) VALUES
    ('en', 'en', 'English'),
    ('de', 'en', 'Englisch'),
    ('en', 'de', 'German'),
    ('de', 'de', 'Deutsch'),
    ('en', 'ru', 'Russian'),
    ('de', 'ru', 'Russisch'),
    ('en', 'zh', 'Chinese'),
    ('de', 'zh', 'Chinesisch'),
    ('en', 'ko', 'Korean'),
    ('de', 'ko', 'Koreanisch'),
    ('en', 'jsPENDING', 'pending'),
    ('en', 'jsOK', 'ok'),
    ('en', 'jsERROR', 'error'),
    ('en', 'jiUI', 'User Interface'),
    ('en', 'jiAPI', 'Application Programming Interface'),
    ('en', 'BTC_XMR', 'Bitcoin/Monero'),
    ('en', 'BTC_ZEC', 'Bitcoin/ZCash'),
    ('en', 'BTC_ETH', 'Bitcoin/Ethereum'),
    ('en', 'BTC', 'Bitcoin'),
    ('en', 'XMR', 'Monero'),
    ('en', 'ZEC', 'ZCash'),
    ('en', 'ETH', 'Ethereum'),

    ('en', 'Dashboard', 'Dashboard'),
    ('de', 'Dashboard', 'Übersicht'),
    ('en', 'Trade', 'Trade'),
    ('de', 'Trade', 'Handel'),
    ('en', 'Social', 'Social'),
    ('de', 'Social', 'Freunde'),
    ('en', 'Network', 'Network'),
    ('de', 'Network', 'Netzwerk'),
    ('en', 'About', 'About'),
    ('de', 'About', 'Über diva'),
    ('en', 'Config', 'Config'),
    ('de', 'Config', 'Konfiguration'),
    ('en', 'Logout', 'Logout'),
    ('de', 'Logout', 'Abmelden'),

    ('en', 'MyOrders', 'My Orders'),
    ('de', 'MyOrders', 'Meine Aufträge'),
    ('en', 'MyTrades', 'My Trades'),
    ('de', 'MyTrades', 'Meine Abschlüsse'),
    ('en', 'Market', 'Market'),
    ('de', 'Market', 'Markt'),
    ('en', 'PaidPrices', 'Paid Prices'),
    ('de', 'PaidPrices', 'Bezahlte Kurse'),

    ('en', 'Buy', 'Buy'),
    ('de', 'Buy', 'Kaufen'),
    ('en', 'Sell', 'Sell'),
    ('de', 'Sell', 'Verkaufen'),
    ('en', 'Buyer', 'Buyer'),
    ('de', 'Buyer', 'Käufer'),
    ('en', 'Seller', 'Seller'),
    ('de', 'Seller', 'Verkäufer'),
    ('en', 'Amount', 'Amount'),
    ('de', 'Amount', 'Menge'),
    ('en', 'Price', 'Price'),
    ('de', 'Price', 'Preis'),

    ('en', 'Hide', 'Hide'),
    ('de', 'Hide', 'Einklappen'),
    ('en', 'Create', 'Create'),
    ('de', 'Create', 'Erstellen'),
    ('en', 'Login', 'Login'),
    ('de', 'Login', 'Anmelden'),
    ('en', 'SignUp', 'Sign Up'),
    ('de', 'SignUp', 'User erstellen'),

    ('en', 'Account', 'Account'),
    ('de', 'Account', 'Benutzer'),
    ('en', 'Role', 'Role'),
    ('de', 'Role', 'Rolle'),
    ('en', 'Karma', 'Karma'),
    ('de', 'Karma', 'Karma'),

    ('en', 'auth.Error', 'Authentication failed'),
    ('de', 'auth.Error', 'Anmeldung fehlgeschlagen'),

    ('en', 'Password', 'Password'),
    ('de', 'Password', 'Passwort'),
    ('en', 'NewPassword', 'New Password'),
    ('de', 'NewPassword', 'Neues Passwort'),

    ('en', 'newuser.PasswordHelp', 'Between 10 and 32 characters: at least a letter, at least a number and at least a special char'),
    ('de', 'newuser.PasswordHelp', 'Zwischen 10 und 32 Zeichen: davon mindestens ein Buchstabe, eine Zahl und ein Sonderzeichen'),
    ('en', 'newuser.CreatingUser', 'Creating User...'),
    ('de', 'newuser.CreatingUser', 'Erstelle User...'),
    ('en', 'newuser.UserCreated', 'User created, login as'),
    ('de', 'newuser.UserCreated', 'User erstellt, anmelden als'),

    ('en', 'main.DivaTitle', 'diva - Personal Distributed Value Exchange'),
    ('de', 'main.SuperHeroTitle', 'Du bist superheldenmässig unterwegs'),
    ('en', 'main.SuperHeroTitle', 'You Are a Bold Super Hero');



DROP TABLE IF EXISTS job_status;
CREATE TABLE job_status (
    job_status_ident TEXT NOT NULL,
    sort_order INTEGER,

    PRIMARY KEY (job_status_ident),
    FOREIGN KEY (job_status_ident) REFERENCES culture(ident)
) WITHOUT ROWID;

INSERT INTO job_status (job_status_ident, sort_order) VALUES
    ('jsPENDING', 1),
    ('jsOK', 2),
    ('jsERROR', 3);

DROP TABLE IF EXISTS job_interface;
CREATE TABLE job_interface (
    job_interface_ident TEXT NOT NULL,
    sort_order INTEGER,

    PRIMARY KEY (job_interface_ident),
    FOREIGN KEY (job_interface_ident) REFERENCES culture(ident)
) WITHOUT ROWID;

INSERT INTO job_interface (job_interface_ident, sort_order) VALUES
    ('jiUI', 1),
    ('jiAPI', 2);

DROP TABLE IF EXISTS job;
CREATE TABLE job (
    job_status_ident TEXT NOT NULL,
    job_interface_ident TEXT NOT NULL,
    request TEXT NOT NULL,
    request_datetime_utc DATETIME NOT NULL DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')),
    response TEXT,
    response_datetime_utc DATETIME,

    FOREIGN KEY (job_status_ident) REFERENCES job_status(job_status_ident),
    FOREIGN KEY (job_interface_ident) REFERENCES job_interface(job_interface_ident)
);

DROP TABLE IF EXISTS contract;
CREATE TABLE contract (
    contract_ident TEXT NOT NULL,
    precision INTEGER NOT NULL DEFAULT 8,

    PRIMARY KEY (contract_ident),
    FOREIGN KEY (contract_ident) REFERENCES culture(ident)
) WITHOUT ROWID;

INSERT INTO contract (contract_ident, precision) VALUES
    ('BTC_XMR', 8),
    ('BTC_ZEC', 8),
    ('BTC_ETH', 8);

DROP TABLE IF EXISTS orderbook;
CREATE TABLE orderbook (
    account_ident TEXT NOT NULL,
    contract_ident TEXT NOT NULL,
    timestamp_ms INTEGER NOT NULL,
    type TEXT CHECK(type IN ('B', 'A')) NOT NULL,
    price TEXT NOT NULL,
    amount TEXT NOT NULL,

    PRIMARY KEY (account_ident, contract_ident, timestamp_ms, type),
    FOREIGN KEY (account_ident) REFERENCES user(account_ident),
    FOREIGN KEY (contract_ident) REFERENCES contract(contract_ident)
) WITHOUT ROWID;

DROP TABLE IF EXISTS market;
CREATE TABLE market (
    account_ident TEXT NOT NULL,
    contract_ident TEXT NOT NULL,
    timestamp_ms INTEGER NOT NULL,
    type TEXT CHECK(type IN ('B', 'A')) NOT NULL,
    price TEXT NOT NULL,
    amount TEXT NOT NULL,

    PRIMARY KEY (account_ident, contract_ident, timestamp_ms, type)
) WITHOUT ROWID;

DROP TABLE IF EXISTS asset;
CREATE TABLE asset (
    asset_ident TEXT NOT NULL,

    PRIMARY KEY (asset_ident),
    FOREIGN KEY (asset_ident) REFERENCES culture(ident)
) WITHOUT ROWID;

INSERT INTO asset (asset_ident) VALUES
    ('BTC'),
    ('XMR'),
    ('ETH');

DROP TABLE IF EXISTS diva_chat;

CREATE TABLE diva_chat_messages (
    account_ident TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp_ms INTEGER NOT NULL,
    sent_received TINYINT NOT NULL,

    PRIMARY KEY (timestamp_ms)
) WITHOUT ROWID;

CREATE TABLE diva_chat_profiles (
    account_ident TEXT NOT NULL,
    avatar TEXT NOT NULL,
    b32_address TEXT NOT NULL,
    pub_key TEXT NOT NULL,
    timestamp_ms INTEGER NOT NULL,

    PRIMARY KEY (account_ident)
) WITHOUT ROWID;

PRAGMA foreign_keys = on
