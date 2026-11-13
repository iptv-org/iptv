package com.iptv.app.ui.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.iptv.app.R
import com.iptv.app.models.Channel
import com.iptv.app.databinding.ItemChannelBinding

class ChannelAdapter(
    private val onChannelClick: (Channel) -> Unit,
    private val onFavoriteToggle: (Channel, ImageView) -> Unit,
    private val isFavorite: (String) -> Boolean
) : RecyclerView.Adapter<ChannelAdapter.ViewHolder>() {

    private val items = mutableListOf<Channel>()

    fun submitList(list: List<Channel>) {
        items.clear()
        items.addAll(list)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemChannelBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(items[position])
    }

    override fun getItemCount(): Int = items.size

    inner class ViewHolder(private val binding: ItemChannelBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(item: Channel) {
            binding.title.text = item.title
            binding.resolution.text = item.resolutionLabel
            binding.group.text = buildGroupLabel(item)

            val fav = isFavorite(item.url)
            binding.btnFavorite.setImageResource(
                if (fav) R.drawable.ic_star else R.drawable.ic_star_outline
            )
            binding.btnFavorite.setTag(item)
            binding.btnFavorite.setOnClickListener {
                val tag = binding.btnFavorite.tag as? Channel
                if (tag != null) onFavoriteToggle(tag, binding.btnFavorite)
            }

            binding.root.setOnClickListener { onChannelClick(item) }
        }

        private fun buildGroupLabel(item: Channel): String {
            val parts = mutableListOf<String>()
            if (item.groupTitle.isNotBlank()) parts.add(item.groupTitle)
            if (item.countryCode.isNotBlank()) parts.add(item.countryCode)
            return parts.joinToString(" • ")
        }
    }
}
