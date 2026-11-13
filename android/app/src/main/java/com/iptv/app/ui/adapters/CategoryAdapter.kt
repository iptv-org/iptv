package com.iptv.app.ui.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.iptv.app.R
import com.iptv.app.network.CategoryInfo
import com.iptv.app.databinding.ItemCategoryBinding

class CategoryAdapter(
    private val onCategoryClick: (CategoryInfo) -> Unit
) : RecyclerView.Adapter<CategoryAdapter.ViewHolder>() {

    private val items = mutableListOf<CategoryInfo>()

    fun submitList(list: List<CategoryInfo>) {
        items.clear()
        items.addAll(list)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemCategoryBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(items[position], holder.itemView.context)
    }

    override fun getItemCount(): Int = items.size

    inner class ViewHolder(private val binding: ItemCategoryBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(item: CategoryInfo, context: android.content.Context) {
            binding.name.text = item.name
            if (item.channelCount > 0) {
                binding.count.text = "${item.channelCount} ${context.getString(R.string.subtitle_channels_count)}"
            } else {
                binding.count.text = context.getString(R.string.subtitle_channels_count)
            }
            binding.root.setOnClickListener { onCategoryClick(item) }
        }
    }
}
