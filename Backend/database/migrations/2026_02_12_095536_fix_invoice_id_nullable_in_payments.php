<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        DB::statement('PRAGMA legacy_alter_table = ON');
        Schema::table('payments', function (Blueprint $table) {
            $table->foreignId('invoice_id')->nullable()->change();
        });
        DB::statement('PRAGMA legacy_alter_table = OFF');
    }
    public function down()
    {
        DB::statement('PRAGMA legacy_alter_table = ON');
        Schema::table('payments', function (Blueprint $table) {
            $table->foreignId('invoice_id')->nullable(false)->change();
        });
        DB::statement('PRAGMA legacy_alter_table = OFF');
    }
};
