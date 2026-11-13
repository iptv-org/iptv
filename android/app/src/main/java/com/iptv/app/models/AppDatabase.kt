package com.iptv.app.models

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.rxjava3
import android.content.Context
import androidx.room.Room

@Database(entities = [FavoriteChannel::class], version = 1, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {
    abstract fun favoriteDao(): FavoriteDao

    companion object {
        @Volatile private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "iptv_favorites"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}
