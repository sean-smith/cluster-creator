// Click handler (jquery)
$(function() {

  $("#create").click(function() {
		region = $("#region").val();
    instance_type = $("#instance_type").val();
    os = $("#os").val();
    email = $("#email").val();

    window.location.href = `https://${region}.console.aws.amazon.com/cloudformation/home?region=${region}#/stacks/create/review?stackName=AWS-HPC-Quickstart&templateURL=https://covid19hpc-quickstart.s3.amazonaws.com/cfn.yaml&param_NotificationEmail=${email}`
	});

  $(".option").change(function() {
    config()
	});

  config();

  function config(){
    region = $("#region").val();
    instance_type = $("#instance_type").val();
    os = $("#os").val();
    efa =  $("#efa").val() == 'True' ? `enable_efa = compute` : ``;
    hyperthreading =  $("#ht").val() == 'True' ? `enable_efa = compute` : ``;

    $("#code").html(`[global]
cluster_template = hpc
update_check = true
sanity_check = true

[aws]
aws_region_name = ${region}

[aliases]
ssh = ssh {CFN_USER}@{MASTER_IP} {ARGS}

[cluster hpc]
key_name = [ssh-key-will-be-generated]
base_os = ${os}
scheduler = slurm
master_instance_type = c5.2xlarge
compute_instance_type = ${instance_type}
vpc_settings = public-private
fsx_settings = fsx-scratch2
disable_hyperthreading = ${hyperthreading}
dcv_settings = dcv
post_install = [post-install-script-will-be-generated]
post_install_args = "/shared/spack-0.13 /opt/slurm/log sacct.log"
s3_read_resource = arn:aws:s3:::*
s3_read_write_resource = [s3-bucket-will-be-generated]/*
initial_queue_size = 0
max_queue_size = 10
placement_group = DYNAMIC
master_root_volume_size = 200
compute_root_volume_size = 80
ebs_settings = myebs
cw_log_settings = cw-logs
${efa}

[ebs myebs]
volume_size = 500
shared_dir = /shared

[dcv mydcv]
enable = master

[fsx fsx-scratch2]
shared_dir = /scratch
storage_capacity = 1200
deployment_type = SCRATCH_2
import_path=[s3_read_write_url]

[dcv dcv]
enable = master
port = 8443
access_from = 0.0.0.0/0

[cw_log cw-logs]
enable = false

[vpc public-private]
vpc_id = [vpc_id]
master_subnet_id = [master_subnet_id]
compute_subnet_id = [compute_subnet_id]`)
  }


});
