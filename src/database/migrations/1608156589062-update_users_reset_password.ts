import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class updateUsersResetPassword1608156589062 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('users', [
      new TableColumn({
        name: 'password_reset_token',
        type: 'varchar',
        isNullable: true
      }),
      new TableColumn({
        name: 'password_reset_expires',
        type: 'timestamp',
        isNullable: true
      })
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('users');
    const newsColumns = ['password_reset_token', 'password_reset_expires'];
    const columnsToDrop = table!.columns.filter(tableColumn => newsColumns.some(newColumn => newColumn === tableColumn.name));
    await queryRunner.dropColumns('users', columnsToDrop);
  }
}
