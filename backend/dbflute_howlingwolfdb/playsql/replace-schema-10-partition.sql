-- partition table fk delete

alter table MESSAGE drop foreign key FK_message_village;
alter table MESSAGE drop foreign key FK_message_player;
alter table MESSAGE drop foreign key FK_message_village_day;
alter table MESSAGE drop foreign key FK_message_village_player;
alter table MESSAGE drop foreign key FK_message_village_player_to;
alter table MESSAGE drop foreign key FK_message_message_type;
alter table MESSAGE drop foreign key FK_message_face_type;
alter table MESSAGE_SENDTO drop foreign key FK_MESSAGE_SENDTO_MESSAGE;

-- MESSAGE 参照キーでの検索（existsMessageSendto の相関 EXISTS、insertMessageSendTo の selectEntity）用の索引を FK に依存せず明示的に持つ。
-- FK 作成時に暗黙生成された同列構成の索引は、この ADD INDEX により置き換えられる（MySQL 8.4 で確認、重複しない）。
alter table MESSAGE_SENDTO add index IX_MESSAGE_SENDTO_MESSAGE (VILLAGE_ID, MESSAGE_NUMBER, MESSAGE_TYPE_CODE);

-- partition

-- message
alter table MESSAGE partition by hash (village_id) partitions 100;
